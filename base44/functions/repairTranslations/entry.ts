import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Repairs missing english_translation + pronunciation on existing LyricLines
 * for a song. Only translates lines where english_translation is empty — does
 * NOT regenerate lines that already have translations.
 *
 * Supports two modes:
 * 1. lineIds provided: translates just those lines (one LLM call) — used by the
 *    admin page which drives batching for per-batch progress.
 * 2. No lineIds: fetches all incomplete lines, batches internally into groups
 *    of 10, and translates each batch.
 *
 * After translating, verifies each write persisted (re-queries by id). If any
 * line is still empty, retries that single line up to 2 times. Finally checks
 * if all lines are now translated and upgrades sync_status from ready_unsynced
 * to ready_synced only if all lines also have valid timestamps.
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

async function translateLines(sb, lines) {
  const textList = lines.map((l) => `${l.line_index}. "${l.spanish_text}"`).join('\n');
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
  // asServiceRole wraps the result in a `response` key; user-scoped does not
  const parsed = result?.response ?? result;
  return parsed?.lines || [];
}

async function translateAndVerifyBatch(sb, lines) {
  // Up to 3 attempts per batch with exponential backoff — catches API errors,
  // malformed/truncated JSON, and partial responses (fewer results than requested).
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const translations = await translateLines(sb, lines);

      // Validate we got a complete response — truncated/partial responses
      // are the most common silent failure mode for large batches.
      if (!translations || translations.length !== lines.length) {
        throw new Error(`Expected ${lines.length} translations, got ${translations?.length || 0}`);
      }

      const updates = [];
      for (const t of translations) {
        const line = lines.find((l) => l.line_index === t.line_index);
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
      return { translated: updates.length };
    } catch (err) {
      lastError = err;
      console.log(`Batch attempt ${attempt}/3 failed (${lines.length} lines): ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  console.error(`Batch failed after 3 attempts (lines ${lines.map((l) => l.line_index).join(',')}): ${lastError?.message}`);
  return { translated: 0 };
}

async function retryIndividualLines(sb, songId) {
  // After all batches, re-query the whole song and individually retry any
  // still-missing lines one at a time — a single-line call is far less likely
  // to fail than a 10-line batch, and isolates exactly which line is the problem.
  const allLines = await sb.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
  const stillMissing = allLines.filter((l) => !l.english_translation || l.english_translation.trim() === '');

  for (const line of stillMissing) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const translations = await translateLines(sb, [line]);
        const t = translations[0];
        if (!t || !t.english_translation) {
          throw new Error('Empty translation returned');
        }
        await sb.entities.LyricLine.update(line.id, {
          english_translation: t.english_translation,
          pronunciation: t.pronunciation || line.pronunciation || '',
        });
        break; // success — move to next line
      } catch (err) {
        if (attempt === 3) {
          console.error(`Line ${line.id} (song ${songId}, index ${line.line_index}) failed all individual retries: ${err.message}`);
        } else {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const { songId, lineIds } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    const sb = base44.asServiceRole;

    // Fetch lines — either specific lines (by id) or all lines for the song
    let lines;
    if (lineIds && Array.isArray(lineIds) && lineIds.length > 0) {
      lines = await sb.entities.LyricLine.filter({ id: { $in: lineIds } }, 'line_index', 500);
    } else {
      lines = await sb.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
    }

    if (!lines || lines.length === 0) {
      return Response.json({ error: 'No lyric lines found' }, { status: 404 });
    }

    const incomplete = lines.filter((l) => !l.english_translation || l.english_translation.trim() === '');
    if (incomplete.length === 0) {
      return Response.json({ success: true, translated: 0, stillMissing: 0, totalLines: lines.length });
    }

    let totalTranslated = 0;

    if (lineIds && lineIds.length > 0) {
      // Single batch (admin page drives batching)
      const result = await translateAndVerifyBatch(sb, incomplete);
      totalTranslated = result.translated;
    } else {
      // Internal batching — groups of 10
      const batchSize = 10;
      for (let i = 0; i < incomplete.length; i += batchSize) {
        const batch = incomplete.slice(i, i + batchSize);
        const result = await translateAndVerifyBatch(sb, batch);
        totalTranslated += result.translated;
      }
    }

    // After all batches, individually retry any still-missing lines one at a time.
    // This catches lines that failed in-batch (API error, truncated response, etc.)
    // and is also the primary recovery path when the admin page calls us with
    // a specific lineIds batch that silently produced zero updates.
    await retryIndividualLines(sb, songId);

    // Final verification — re-query ALL lines for the song and count accurately
    const allLines = await sb.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
    const totalStillMissing = allLines.filter((l) => !l.english_translation || l.english_translation.trim() === '').length;

    if (totalStillMissing === 0) {
      const song = await sb.entities.Song.get(songId);
      if (song.sync_status === 'ready_unsynced') {
        const allSynced = allLines.every((l) => (l.start_seconds || 0) > 0 && (l.end_seconds || 0) > 0);
        if (allSynced) {
          await sb.entities.Song.update(songId, { sync_status: 'ready_synced' });
        }
      }
    }

    return Response.json({
      success: true,
      translated: totalTranslated,
      stillMissing: totalStillMissing,
      totalLines: allLines.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}