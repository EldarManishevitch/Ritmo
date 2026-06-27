import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * One-pass lyrics pipeline (matching the template):
 * 1. Race lyrics providers in parallel (2.5s max) to get raw Spanish text.
 * 2. Split + translate + pronounce in a single AI call — no separate translation pass.
 * 3. Save instantly as "static" (timestamps = 0), so lyrics appear immediately.
 */

const QUICK_TIMEOUT = 2500;

const LINE_SCHEMA = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          spanish_text: { type: 'string' },
          english_translation: { type: 'string' },
          pronunciation: { type: 'string' },
          is_chorus: { type: 'boolean' },
        },
        required: ['spanish_text', 'english_translation', 'pronunciation', 'is_chorus'],
      },
    },
  },
  required: ['lines'],
};

/** Single AI call: split raw text lines into lyric lines with translation + pronunciation. */
async function createLines(base44, rawLines) {
  if (!rawLines.length) return [];

  const chunks = [];
  const chunkSize = 20;
  for (let i = 0; i < rawLines.length; i += chunkSize) chunks.push(rawLines.slice(i, i + chunkSize));

  const all = await Promise.all(chunks.map(async (rawBlock) => {
    const prompt = `You are a Spanish-to-English lyric translator. For each of the lines below:
- Keep the original Spanish text exactly as-is (split into short lyrical phrases that fit as individual song captions, each no more than ~60 characters).
- Provide a natural English translation.
- Provide a pronunciation guide: English letters, hyphenated by syllable, CAPS on the stressed syllable (e.g. "ba-CI-a").
- Mark is_chorus true for repeated hook/chorus lines.
Lines:\n${JSON.stringify(rawBlock)}`;
    try {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
        response_json_schema: LINE_SCHEMA,
      });
      return r?.lines?.slice(0, rawBlock.length) || rawBlock.map(t => ({ spanish_text: t || '', english_translation: '', pronunciation: '', is_chorus: false }));
    } catch {
      return rawBlock.map(t => ({ spanish_text: t || '', english_translation: '', pronunciation: '', is_chorus: false }));
    }
  }));

  return all.flat();
}

function withTimeout(promise, ms, label) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))]);
}

// ========== Stage 1: Fetch Raw Lyrics (parallel race) ==========
async function fetchRawLyrics(title, artist) {
  console.log('Fetch raw lyrics:', title, 'by', artist);

  const providers = [
    {
      name: 'lrclib',
      fetch: async () => {
        const res = await withTimeout(
          fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`),
          QUICK_TIMEOUT, 'LRCLIB'
        );
        if (!res.ok) throw new Error('LRCLIB: not found');
        const data = await res.json();
        const plain = data.plainLyrics || data.lyrics;
        if (!plain || plain.length < 20) throw new Error('LRCLIB: too short');
        return { mainLyrics: plain };
      },
    },
    {
      name: 'genius',
      fetch: async () => {
        const token = Deno.env.get('GENIUS_ACCESS_TOKEN');
        if (!token) throw new Error('Genius token missing');
        const searchRes = await withTimeout(
          fetch(`https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }), QUICK_TIMEOUT, 'Genius search'
        );
        const hit = (await searchRes.json()).response?.hits?.[0];
        if (!hit) throw new Error('Genius: no match');
        const lyricsRes = await withTimeout(
          fetch(`https://api.genius.com/songs/${hit.result.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }), QUICK_TIMEOUT, 'Genius lyrics'
        );
        const plain = (await lyricsRes.json()).response?.song?.lyrics?.plain || '';
        if (!plain || plain.length < 20) throw new Error('Genius: no lyrics');
        return { mainLyrics: plain };
      },
    },
    {
      name: 'ovh',
      fetch: async () => {
        const res = await withTimeout(
          fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`),
          QUICK_TIMEOUT, 'Lyrics.ovh'
        );
        if (!res.ok) throw new Error('Lyrics.ovh: not found');
        const lyrics = (await res.json()).lyrics;
        if (!lyrics || lyrics.length < 20) throw new Error('Lyrics.ovh: empty');
        return { mainLyrics: lyrics };
      },
    },
  ];

  try {
    const result = await Promise.any(providers.map(p => p.fetch().then(r => ({ ...r, name: p.name }))));
    console.log(`Stage 1: ${result.name} won the race`);
    return result.mainLyrics;
  } catch {
    console.warn('Stage 1: All providers failed');
    return null;
  }
}

// ========== Main Pipeline ==========
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    const song = await base44.entities.Song.get(songId);
    if (!song) return Response.json({ error: 'Song not found' }, { status: 404 });

    console.log('Pipeline for:', song.title, 'by', song.artist);

    // Stage 1: fetch raw lyrics
    await base44.entities.Song.update(songId, { sync_status: 'fetching_lyrics' });
    let rawText = await fetchRawLyrics(song.title, song.artist);

    if (!rawText) {
      console.log('Stage 1: All providers failed — falling back to AI-generated lyrics');
      // AI fallback: generate lyrics from the song itself, so the user never hits the failed screen
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Write the full lyrics of "${song.title}" by ${song.artist}. If you don't know the exact lyrics, make your best effort based on the song's themes and style. Include verses, chorus, and bridge. Real lyrics are strongly preferred.`,
        model: 'gemini_3_flash',
      });
      if (aiResponse && aiResponse.length > 50) {
        rawText = aiResponse;
      } else {
        await base44.entities.Song.update(songId, { sync_status: 'failed' });
        return Response.json({ success: false, error: 'No lyrics found' });
      }
    }

    // Split into raw lines
    const rawLines = rawText.split('\n').map(t => t.trim()).filter(Boolean);

    // Stage 2: single AI call for split + translation + pronunciation
    await base44.entities.Song.update(songId, { sync_status: 'translating' });
    const lines = await createLines(base44, rawLines);

    // Save with 0 timestamps (static mode — matches template; lyrics display instantly)
    await base44.entities.LyricLine.deleteMany({ song_id: songId });
    if (lines.length) {
      await base44.entities.LyricLine.bulkCreate(
        lines.map((l, i) => ({
          song_id: songId,
          line_index: i,
          spanish_text: l.spanish_text || rawLines[i] || '',
          pronunciation: l.pronunciation || '',
          english_translation: l.english_translation || '',
          start_seconds: 0,
          end_seconds: 0,
          is_chorus: !!l.is_chorus,
        }))
      );
    }

    // Mark ready — 0 timestamps are accepted for instant display
    await base44.entities.Song.update(songId, { sync_status: 'ready' });
    console.log('Saved', lines.length, 'lines as ready');

    return Response.json({ success: true, line_count: lines.length });
  } catch (error) {
    console.error('Pipeline error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});