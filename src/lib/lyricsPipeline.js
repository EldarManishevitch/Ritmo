import { base44 } from '@/api/base44Client';

// ---------- LRCLIB ----------
async function fetchLrclib(title, artist) {
  try {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;
    const synced = results.find((r) => r.syncedLyrics) || results[0];
    return {
      syncedLyrics: synced.syncedLyrics || null,
      plainLyrics: synced.plainLyrics || null,
    };
  } catch {
    return null;
  }
}

// ---------- LRC parser ----------
function parseLRC(lrc) {
  const lines = [];
  const timeRe = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of lrc.split('\n')) {
    const text = raw.replace(timeRe, '').trim();
    if (!text) continue;
    const stamps = [...raw.matchAll(timeRe)];
    for (const m of stamps) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const frac = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) / 1000 : 0;
      lines.push({ start: min * 60 + sec + frac, text });
    }
  }
  lines.sort((a, b) => a.start - b.start);
  for (let i = 0; i < lines.length; i++) {
    lines[i].end = i < lines.length - 1 ? lines[i + 1].start : lines[i].start + 5;
  }
  return lines;
}

// ---------- AI translate + pronounce, parallel chunks ----------
async function translateLines(spanishTexts) {
  const CHUNK = 8;
  const chunks = [];
  for (let i = 0; i < spanishTexts.length; i += CHUNK) chunks.push(spanishTexts.slice(i, i + CHUNK));

  const results = await Promise.all(
    chunks.map((chunk) =>
      base44.integrations.Core.InvokeLLM({
        prompt: `For these Spanish lyric lines, return a natural English translation and a pronunciation guide for each, in order. Pronunciation guide: English letters, hyphenated by syllable, CAPS on the stressed syllable (e.g. "ba-CI-a"). Mark is_chorus true if the line is part of a repeated chorus.\nLines:\n${JSON.stringify(chunk)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  english_translation: { type: 'string' },
                  pronunciation: { type: 'string' },
                  is_chorus: { type: 'boolean' },
                },
              },
            },
          },
          required: ['lines'],
        },
      })
    )
  );

  return results.flatMap((c) => c.lines || []);
}

/**
 * Full client-side lyrics pipeline.
 * LRCLIB -> parse -> AI translate -> save LyricLine records -> flip Song.sync_status.
 * Subscribe to LyricLine for realtime streaming as records land.
 */
export async function generateLyrics({ songId, title, artist, youtubeId }) {
  // Resolve or create the song
  let song;
  if (songId) {
    song = await base44.entities.Song.get(songId);
  } else if (title && artist) {
    song = await base44.entities.Song.create({ title, artist, youtube_id: youtubeId, sync_status: 'fetching_lyrics' });
  } else {
    throw new Error('songId or title+artist required');
  }

  const id = song.id;
  await base44.entities.Song.update(id, { sync_status: 'fetching_lyrics' });

  const lrc = await fetchLrclib(song.title, song.artist);
  let syncedLines = null;
  let staticText = null;

  if (lrc?.syncedLyrics) {
    syncedLines = parseLRC(lrc.syncedLyrics);
  } else if (lrc?.plainLyrics) {
    staticText = lrc.plainLyrics;
  } else {
    // AI fallback for raw lyrics text (web search)
    const aiLyrics = await base44.integrations.Core.InvokeLLM({
      prompt: `Return the full Spanish lyrics for the song "${song.title}" by "${song.artist}". Only the lyrics, one line per line, no metadata or section labels.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: { lines: { type: 'array', items: { type: 'string' } } },
        required: ['lines'],
      },
    });
    staticText = (aiLyrics.lines || []).join('\n');
  }

  if (!syncedLines && !staticText) {
    await base44.entities.Song.update(id, { sync_status: 'failed' });
    throw new Error('No lyrics found');
  }

  await base44.entities.Song.update(id, { sync_status: 'translating' });

  const rawLines = syncedLines
    ? syncedLines.map((l) => ({ spanish_text: l.text, start_seconds: l.start, end_seconds: l.end }))
    : staticText
        .split('\n')
        .map((t) => ({ spanish_text: t.trim(), start_seconds: 0, end_seconds: 0 }))
        .filter((l) => l.spanish_text);

  const translations = await translateLines(rawLines.map((l) => l.spanish_text));

  // Replace existing lines
  await base44.entities.LyricLine.deleteMany({ song_id: id });

  const records = rawLines.map((l, idx) => ({
    song_id: id,
    line_index: idx,
    spanish_text: l.spanish_text,
    pronunciation: translations[idx]?.pronunciation || '',
    english_translation: translations[idx]?.english_translation || '',
    start_seconds: l.start_seconds,
    end_seconds: l.end_seconds,
    is_chorus: translations[idx]?.is_chorus || false,
  }));

  await base44.entities.LyricLine.bulkCreate(records);

  const finalStatus = syncedLines ? 'ready' : 'static';
  await base44.entities.Song.update(id, { sync_status: finalStatus });

  return { song_id: id, sync_status: finalStatus, line_count: records.length };
}