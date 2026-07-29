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
  const translations = await translateLines(sb, lines);

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

  // Verify writes persisted — re-query the updated records by id
  const updatedIds = updates.map((u) => u.id);
  let verified = updatedIds.length > 0
    ? await sb.entities.LyricLine.filter({ id: { $in: updatedIds } }, 'line_index', 500)
    : [];
  let stillEmpty = verified.filter((l) => !l.english_translation || l.english_translation.trim() === '');

  // Retry individual lines up to 2 times
  for (let attempt = 1; attempt <= 2 && stillEmpty.length > 0; attempt++) {
    console.log(`Repair verify: ${stillEmpty.length} lines still empty, retrying individually (attempt ${attempt}/2)`);
    for (const line of stillEmpty) {
      try {
        const singleResult = await translateLines(sb, [line]);
        const t = singleResult[0];
        if (t && t.english_translation) {
          await sb.entities.LyricLine.update(line.id, {
            english_translation: t.english_translation,
            pronunciation: t.pronunciation || line.pronunciation || '',
          });
        }
      } catch (e) {
        console.log(`Individual retry failed for line ${line.id}: ${e.message}`);
      }
    }
    verified = await sb.entities.LyricLine.filter({ id: { $in: stillEmpty.map((l) => l.id) } }, 'line_index', 500);
    stillEmpty = verified.filter((l) => !l.english_translation || l.english_translation.trim() === '');
  }

  return { translated: updates.length, stillMissing: stillEmpty.length };
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

    // Check if all lines are now translated and handle sync_status
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