import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Stage 2: Independent Translation Pipeline — completely isolated background
 * processing. 3 AI models race in parallel with each handling all lines in
 * one call using a structured JSON schema, so each model returns
 * pronunciation + english_translation for every line.
 *
 * NOTE: This function maps "gemini-2.5-flash" etc. to the deployed model
 * names supported by base44 (gemini_3_flash = the latest flash tier).
 */

const LINE_SCHEMA = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          line_index: { type: 'number' },
          english_translation: { type: 'string' },
          pronunciation: { type: 'string' },
          is_chorus: { type: 'boolean' },
        },
        required: ['line_index', 'english_translation', 'pronunciation', 'is_chorus'],
      },
    },
  },
  required: ['lines'],
};

const LINE_SCHEMA_LITE = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          line_index: { type: 'number' },
          english_translation: { type: 'string' },
        },
        required: ['line_index', 'english_translation'],
      },
    },
  },
  required: ['lines'],
};

async function translateBlock(base44, model, rawLines) {
  const schema = model === 'gemini_3_flash' ? LINE_SCHEMA : LINE_SCHEMA_LITE;
  const textList = rawLines.map((t, i) => `${i}. "${t}"`).join('\n');

  const prompt = `You are a Spanish-to-English lyric translator. Translate each line below accurately and naturally. For reference: the input number is the line index but do NOT include it in your output — only return the translated lines.

${model === 'gemini_3_flash' ? `For each line, provide:
- english_translation: a natural, accurate English translation (preserve the tone/feeling)
- pronunciation: phonetic guide in English letters, hyphenated by syllable, CAPS on the stressed syllable (e.g. "ba-CI-a" or "ko-MO es-TAS")
- is_chorus: true if this is a repeated hook line` : `For each line, provide:
- english_translation: a natural, accurate English translation`}
${model === 'gemini_3_flash' ? `Full schema return:\n${textList}` : `Return translations.\n${textList}`}`;

  const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema, model });
  return result?.lines || [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require an authenticated user before any service-role data modification
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    console.log('Stage 2 translation:', songId);

    // Fetch current raw lines to translate
    const rawLines = await base44.asServiceRole.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
    const spanishLines = (rawLines || []).map(l => l.spanish_text);
    const lineIds = (rawLines || []).map(l => l.id);

    if (!spanishLines.length) {
      console.log('Stage 2: nothing to translate');
      return Response.json({ success: true, stage: 2, lines_translated: 0 });
    }

    console.log(`Stage 2 translating ${spanishLines.length} lines`);

    // Race 3 AI models in parallel — gemini_3_flash does full pronunciation/chorus
    const results = await Promise.any([
      translateBlock(base44, 'gemini_3_flash', spanishLines),
      translateBlock(base44, 'gemini_3_flash', spanishLines),
      translateBlock(base44, 'gpt_5_mini', spanishLines),
    ]);

    const translationMap = Array.isArray(results) ? results : [];
    console.log(`Stage 2 winner produced ${translationMap.length} translations`);

    // Bulk-update all lines at once instead of one-by-one
    const updates = [];
    for (let i = 0; i < spanishLines.length; i++) {
      const matched = translationMap.find(t => t.line_index === i);
      if (matched && spanishLines[i].trim()) {
        updates.push({
          id: lineIds[i],
          english_translation: matched.english_translation || '',
          pronunciation: matched.pronunciation || '',
          is_chorus: !!matched.is_chorus,
        });
      }
    }
    if (updates.length > 0) {
      await base44.asServiceRole.entities.LyricLine.bulkUpdate(updates);
    }

    const readyCount = updates.length;
    return Response.json({ success: true, stage: 2, lines_translated: readyCount });
  } catch (error) {
    console.error('Stage 2 error:', error.message);
    // Never affect original lyrics — return graceful
    return Response.json({ success: true, stage: 2, error: error.message });
  }
});