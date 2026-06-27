import { base44 } from '@/api/base44Client';

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

// Guard any promise with a hard timeout so a hanging call can't stall the pipeline.
function withTimeout(promise, ms, label = 'op') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

// ---------- AI translate + pronounce, 3-model race per chunk ----------
const TRANSLATION_MODELS = ['gemini_3_flash', 'gpt_5_mini', 'claude_sonnet_4_6'];
const TRANSLATE_CHUNK = 8;

const TRANSLATE_PROMPT = (lines) =>
  `For these Spanish lyric lines, return a natural English translation and a pronunciation guide for each, in order. Pronunciation guide: English letters, hyphenated by syllable, CAPS on the stressed syllable (e.g. "ba-CI-a"). Mark is_chorus true if the line is part of a repeated chorus.\nLines:\n${JSON.stringify(lines)}`;
const TRANSLATE_SCHEMA = {
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
};

// Translate one chunk of lines, racing 3 models — first valid response (≥80% lines) wins.
async function translateChunk(spanishTexts) {
  const minLines = Math.ceil(spanishTexts.length * 0.8);
  return Promise.any(
    TRANSLATION_MODELS.map((model) =>
      withTimeout(
        base44.integrations.Core.InvokeLLM({ prompt: TRANSLATE_PROMPT(spanishTexts), model, response_json_schema: TRANSLATE_SCHEMA }),
        45000,
        `translate ${model}`
      ).then((r) => {
        if (!r?.lines || r.lines.length < minLines) {
          throw new Error(`${model} returned ${r?.lines?.length || 0}/${spanishTexts.length} lines`);
        }
        console.log(`translation race: ${model} won (${r.lines.length} lines)`);
        return r.lines;
      })
    )
  ).catch(() => {
    console.log('translation race: all models failed for chunk');
    return spanishTexts.map(() => ({ english_translation: '', pronunciation: '', is_chorus: false }));
  });
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

  // Race 3 lyric sources in parallel: LRCLIB + Genius (backend) + LLM web search
  const [lyricsRes, aiRes] = await Promise.allSettled([
    withTimeout(base44.functions.invoke('fetchLyrics', { title: song.title, artist: song.artist }), 30000, 'fetchLyrics'),
    withTimeout(
      base44.integrations.Core.InvokeLLM({
        prompt: `Return the full Spanish lyrics for the song "${song.title}" by "${song.artist}". Only the lyrics, one line per line, no metadata or section labels.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: { lines: { type: 'array', items: { type: 'string' } } },
          required: ['lines'],
        },
      }),
      30000,
      'llm lyrics'
    ),
  ]);

  const lrc = lyricsRes.status === 'fulfilled' ? lyricsRes.value?.data : null;
  const aiLyrics = aiRes.status === 'fulfilled' ? aiRes.value : null;
  console.log(`lyrics race: lrclib=${!!lrc?.sources?.lrclib} genius=${!!lrc?.sources?.genius} synced=${!!lrc?.syncedLyrics} llm=${!!aiLyrics?.lines?.length}`);

  let syncedLines = null;
  let staticText = null;

  if (lrc?.syncedLyrics) {
    syncedLines = parseLRC(lrc.syncedLyrics);
  } else if (lrc?.plainLyrics) {
    staticText = lrc.plainLyrics;
  } else if (aiLyrics?.lines?.length) {
    staticText = aiLyrics.lines.join('\n');
  }

  if (!syncedLines && !staticText) {
    await base44.entities.Song.update(id, { sync_status: 'failed' });
    throw new Error('No lyrics found');
  }

  const rawLines = syncedLines
    ? syncedLines.map((l) => ({ spanish_text: l.text, start_seconds: l.start, end_seconds: l.end }))
    : staticText
        .split('\n')
        .map((t) => ({ spanish_text: t.trim(), start_seconds: 0, end_seconds: 0 }))
        .filter((l) => l.spanish_text);

  // Phase 1: create LyricLine records with Spanish text + timestamps immediately,
  // so the user sees the lyrics right away (UI is realtime-subscribed). Translation
  // runs afterwards in the background and streams in without blocking the UI.
  await base44.entities.LyricLine.deleteMany({ song_id: id });
  await base44.entities.LyricLine.bulkCreate(
    rawLines.map((l, idx) => ({
      song_id: id,
      line_index: idx,
      spanish_text: l.spanish_text,
      pronunciation: '',
      english_translation: '',
      start_seconds: l.start_seconds,
      end_seconds: l.end_seconds,
      is_chorus: false,
    }))
  );
  await base44.entities.Song.update(id, { sync_status: 'translating' });

  // Phase 2 (background): translate chunk-by-chunk in parallel, updating each
  // chunk's records progressively so English translations stream in live.
  const created = await base44.entities.LyricLine.filter({ song_id: id }, 'line_index', 500);
  const chunks = [];
  for (let i = 0; i < rawLines.length; i += TRANSLATE_CHUNK) {
    chunks.push({ start: i, texts: rawLines.slice(i, i + TRANSLATE_CHUNK).map((l) => l.spanish_text) });
  }
  await Promise.all(
    chunks.map(async (chunk) => {
      const translations = await translateChunk(chunk.texts);
      await base44.entities.LyricLine.bulkUpdate(
        translations.map((t, i) => ({
          id: created[chunk.start + i]?.id,
          english_translation: t?.english_translation || '',
          pronunciation: t?.pronunciation || '',
          is_chorus: t?.is_chorus || false,
        }))
      );
    })
  );

  const finalStatus = syncedLines ? 'ready' : 'static';
  await base44.entities.Song.update(id, { sync_status: finalStatus });

  return { song_id: id, sync_status: finalStatus, line_count: rawLines.length };
}