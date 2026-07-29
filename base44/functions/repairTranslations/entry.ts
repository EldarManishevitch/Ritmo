import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Repairs missing english_translation + pronunciation on existing LyricLines
 * for a song. Only translates lines where english_translation is empty — does
 * NOT regenerate lines that already have translations. Used by the admin
 * curriculum-health page for "ready but missing translations" songs.
 */

const SCHEMA = {
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
        },
        required: ['line_index', 'english_translation', 'pronunciation'],
      },
    },
  },
  required: ['lines'],
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    const sb = base44.asServiceRole;

    const allLines = await sb.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
    if (!allLines || allLines.length === 0) {
      return Response.json({ error: 'No lyric lines found' }, { status: 404 });
    }

    const incomplete = allLines.filter((l) => !l.english_translation || l.english_translation.trim() === '');
    if (incomplete.length === 0) {
      return Response.json({ success: true, repaired: 0, message: 'All lines already translated' });
    }

    const textList = incomplete.map((l) => `${l.line_index}. "${l.spanish_text}"`).join('\n');
    const result = await sb.integrations.Core.InvokeLLM({
      prompt: `You are a Spanish-to-English lyric translator. Translate each line below accurately and naturally. The number is the line_index — include it in your output.

For each line provide:
- line_index: the input number
- english_translation: a natural, accurate English translation (preserve tone/feeling)
- pronunciation: phonetic guide in English letters, hyphenated by syllable, CAPS on the stressed syllable

Lines:
${textList}`,
      response_json_schema: SCHEMA,
      model: 'claude_sonnet_4_6',
    });

    const translations = result?.lines || [];
    const updates = [];
    for (const t of translations) {
      const line = incomplete.find((l) => l.line_index === t.line_index);
      if (line && t.english_translation) {
        updates.push({
          id: line.id,
          english_translation: t.english_translation,
          pronunciation: t.pronunciation || line.pronunciation || '',
        });
      }
    }

    if (updates.length > 0) {
      await sb.entities.LyricLine.bulkUpdate(updates);
    }

    return Response.json({ success: true, repaired: updates.length, total_lines: allLines.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}