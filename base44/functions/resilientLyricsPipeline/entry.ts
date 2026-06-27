import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Three-Stage Resilient Lyrics Pipeline
 * Stage 1: Absolute race for original lyrics (never fails)
 * Stage 2: Independent translation (non-blocking)
 * Stage 3: Isolated timestamp sync with auto-retry
 */

const PLACEHOLDER_LYRICS = [
  '[Instrumental]',
  'Lyrics could not be loaded automatically.',
  'Please try resubmitting or check back later.',
];

function withTimeout(promise, ms, label = 'op') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

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

const QUICK_TIMEOUT = 2500;

async function fetchOriginalLyrics(title, artist) {
  console.log('Stage 1: Sequential quick-fetch for', title, 'by', artist);
  
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
        console.log('LRCLIB quick-fetch succeeded');
        return { mainLyrics: plain, syncedLyrics: data.syncedLyrics || null };
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
        console.log('Genius quick-fetch succeeded');
        return { mainLyrics: plain, syncedLyrics: null };
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
        console.log('Lyrics.ovh quick-fetch succeeded');
        return { mainLyrics: lyrics, syncedLyrics: null };
      },
    },
  ];

  for (const prov of providers) {
    try {
      const result = await prov.fetch();
      if (result) {
        console.log(`Stage 1: ${prov.name} delivered (quick mode)`);
        return { source: prov.name, ...result };
      }
    } catch (err) {
      console.log(`Stage 1: ${prov.name} failed fast —`, err.message);
    }
  }
  
  console.warn('Stage 1: All providers failed quickly, using placeholder');
  return { 
    source: 'placeholder', 
    mainLyrics: PLACEHOLDER_LYRICS.join('\n'), 
    syncedLyrics: null 
  };
}

const TRANSLATION_MODELS = ['gemini_3_flash', 'gpt_5_mini', 'claude_sonnet_4_6'];
const TRANSLATE_CHUNK = 8;

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
        required: ['english_translation', 'pronunciation', 'is_chorus'],
      },
    },
  },
  required: ['lines'],
};

async function translateChunk(base44, spanishTexts, sourceLanguage = 'Spanish') {
  const minLines = Math.ceil(spanishTexts.length * 0.8);
  const prompt = `For these ${sourceLanguage} lyric lines, return a natural English translation and a pronunciation guide for each, in order. Pronunciation guide: English letters, hyphenated by syllable, CAPS on the stressed syllable (e.g. "ba-CI-a"). Mark is_chorus true if the line is part of a repeated chorus.\nLines:\n${JSON.stringify(spanishTexts)}`;
  
  try {
    return await Promise.any(
      TRANSLATION_MODELS.map((model) =>
        withTimeout(
          base44.integrations.Core.InvokeLLM({
            prompt,
            model,
            response_json_schema: TRANSLATE_SCHEMA,
          }),
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
    );
  } catch {
    console.log('translation race: all models failed for chunk');
    return spanishTexts.map(() => ({ english_translation: '', pronunciation: '', is_chorus: false }));
  }
}

async function runTranslation(base44, songId, sourceLanguage) {
  try {
    console.log('Stage 2: Starting translation pipeline');
    await base44.entities.Song.update(songId, { sync_status: 'translating' });
    
    const created = await base44.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
    const chunks = [];
    
    for (let i = 0; i < created.length; i += TRANSLATE_CHUNK) {
      chunks.push({ 
        start: i, 
        texts: created.slice(i, i + TRANSLATE_CHUNK).map((l) => l.spanish_text) 
      });
    }
    
    await Promise.all(
      chunks.map(async (chunk) => {
        const translations = await translateChunk(base44, chunk.texts, sourceLanguage);
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
    
    console.log('Stage 2: Translation complete');
    return true;
  } catch (error) {
    console.error('Stage 2: Translation failed (non-blocking)', error.message);
    return false;
  }
}

async function syncTimestamps(base44, songId, title, artist, maxAttempts = 2) {
  console.log('Stage 3: Starting timestamp synchronization');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Stage 3: Attempt ${attempt}/${maxAttempts}`);
      
      const res = await withTimeout(
        fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`)
          .then(r => r.ok ? r.json() : null),
        10000,
        'LRCLIB sync'
      );
      
      if (res?.syncedLyrics) {
        const syncedLines = parseLRC(res.syncedLyrics);
        const created = await base44.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
        
        await base44.entities.LyricLine.bulkUpdate(
          syncedLines.map((l, i) => ({
            id: created[i]?.id,
            start_seconds: l.start,
            end_seconds: l.end,
          }))
        );
        
        await base44.entities.Song.update(songId, { sync_status: 'ready' });
        console.log('Stage 3: Sync successful');
        return true;
      }
      
      throw new Error('No synced lyrics available');
      
    } catch (error) {
      console.error(`Stage 3: Attempt ${attempt} failed`, error.message);
      
      if (attempt === maxAttempts) {
        await base44.entities.Song.update(songId, { sync_status: 'static' });
        console.log('Stage 3: All attempts failed, fallback to static mode');
        return false;
      }
    }
  }
  
  return false;
}

// ========== Main Pipeline ==========
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId, sourceLanguage = 'Spanish' } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    const song = await base44.entities.Song.get(songId);
    if (!song) return Response.json({ error: 'Song not found' }, { status: 404 });

    console.log(`Pipeline started for: ${song.title} - ${song.artist}`);

    // ========== STAGE 1: Absolute Race for Original Lyrics ==========
    console.log('Stage 1: Fetching original lyrics');
    await base44.entities.Song.update(songId, { sync_status: 'fetching_lyrics' });
    
    const lyricsResult = await fetchOriginalLyrics(song.title, song.artist);
    
    let rawLines = [];
    let hasSyncedTimestamps = false;
    
    if (lyricsResult.syncedLyrics) {
      const syncedLines = parseLRC(lyricsResult.syncedLyrics);
      rawLines = syncedLines.map((l) => ({ 
        spanish_text: l.text, 
        start_seconds: l.start, 
        end_seconds: l.end 
      }));
      hasSyncedTimestamps = true;
    } else {
      rawLines = (lyricsResult.mainLyrics || '')
        .split('\n')
        .map((t) => ({ spanish_text: t.trim(), start_seconds: 0, end_seconds: 0 }))
        .filter((l) => l.spanish_text);
    }
    
    await base44.entities.LyricLine.deleteMany({ song_id: songId });
    await base44.entities.LyricLine.bulkCreate(
      rawLines.map((l, idx) => ({
        song_id: songId,
        line_index: idx,
        spanish_text: l.spanish_text,
        pronunciation: '',
        english_translation: '',
        start_seconds: l.start_seconds,
        end_seconds: l.end_seconds,
        is_chorus: false,
      }))
    );
    
    console.log(`Stage 1: Saved ${rawLines.length} lines from ${lyricsResult.source}`);

    // ========== STAGE 2: Independent Translation (Non-blocking) ==========
    runTranslation(base44, songId, sourceLanguage).catch(err => {
      console.error('Stage 2 background failure:', err.message);
    });

    // ========== STAGE 3: Isolated Timestamp Sync with Auto-Retry ==========
    if (!hasSyncedTimestamps && song.youtube_id) {
      syncTimestamps(base44, songId, song.title, song.artist).catch(err => {
        console.error('Stage 3 background failure:', err.message);
      });
    } else if (hasSyncedTimestamps) {
      await base44.entities.Song.update(songId, { sync_status: 'ready' });
    }

    return Response.json({ 
      success: true, 
      line_count: rawLines.length,
      source: lyricsResult.source,
      has_timestamps: hasSyncedTimestamps,
    });
    
  } catch (error) {
    console.error('Pipeline error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});