import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Stage 1: Race 6 providers to fetch raw Spanish lyrics,
 * then instantly write them to the DB so the UI renders them via realtime.
 */

const QUICK_TIMEOUT = 2800;

/** Genius API lookup */
async function fetchGenius(title, artist) {
  const token = Deno.env.get('GENIUS_ACCESS_TOKEN');
  if (!token) throw new Error('Genius token missing');
  const searchRes = await fetch(
    `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const hit = (await searchRes.json()).response?.hits?.[0];
  if (!hit) throw new Error('Genius search: no match');
  const songRes = await fetch(
    `https://api.genius.com/songs/${hit.result.id}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const plain = (await songRes.json()).response?.song?.lyrics?.plain || '';
  if (!plain || plain.length < 20) throw new Error('Genius song: empty');
  return { lines: plain.split('\n').map(t => t.trim()).filter(Boolean), name: 'Genius API' };
}

/** LRCLIB */
async function fetchLRCLIB(title, artist) {
  const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
  if (!res.ok) throw new Error('LRCLIB: not found');
  const data = await res.json();
  const plain = data.plainLyrics || data.syncedLyrics || data.lyrics || '';
  if (!plain || plain.length < 20) throw new Error('LRCLIB: empty');
  return { lines: plain.split('\n').map(t => t.trim()).filter(Boolean), name: 'LRCLIB' };
}

/** lyrics.ovh */
async function fetchOVH(title, artist) {
  const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
  if (!res.ok) throw new Error('OVH: not found');
  const lyrics = (await res.json()).lyrics;
  if (!lyrics || lyrics.length < 20) throw new Error('OVH: empty');
  return { lines: lyrics.split('\n').map(t => t.trim()).filter(Boolean), name: 'OVH' };
}

/** NetEase Cloud Music — two-step: search then get lyrics */
async function fetchNetEase(title, artist) {
  const searchRes = await fetch(
    `https://music.163.com/api/search/get/web?csrf_token=&hlpretag=&hlposttag=&type=1&s=${encodeURIComponent(`${artist} ${title}`)}&offset=0&total=true&limit=5`,
    { headers: { 'Referer': 'https://music.163.com' } }
  );
  if (!searchRes.ok) throw new Error('NetEase: search failed');
  const searchData = await searchRes.json();
  const song = (searchData.result?.songs || [])[0];
  if (!song || !song.id) throw new Error('NetEase: no song match');

  const lyricRes = await fetch(`https://music.163.com/api/song/lyric?id=${song.id}&lv=-1&kv=-1&tv=-1`, {
    headers: { 'Referer': 'https://music.163.com' }
  });
  if (!lyricRes.ok) throw new Error('NetEase: lyric fetch failed');
  const lyricData = await lyricRes.json();
  const raw = lyricData.lrc?.lyric || lyricData.klyric?.lyric || '';
  if (!raw || raw.length < 20) throw new Error('NetEase: empty');
  const stripped = raw.replace(/\[\d+:\d+\.\d+\]/g, '');
  return { lines: stripped.split('\n').map(t => t.trim()).filter(Boolean), name: 'NetEase' };
}

/** Megalobiz — scrape lyrics page */
async function fetchMegalobiz(title, artist) {
  const q = `${title} ${artist} lyrics megalobiz`.toLowerCase().replace(/\s+/g, '+');
  const searchRes = await fetch(`https://www.megalobiz.com/search/all?qty=1&search_type=all&search_pattern=${encodeURIComponent(q)}`);
  if (!searchRes.ok) throw new Error('Megalobiz: search failed');
  const html = await searchRes.text();
  const linkMatch = html.match(/\/\/www\.megalobiz\.com\/l\/[\w-]+\.html/);
  if (!linkMatch) throw new Error('Megalobiz: no link found');
  const detailRes = await fetch(`https:${linkMatch[0]}`);
  if (!detailRes.ok) throw new Error('Megalobiz: detail failed');
  const detail = await detailRes.text();
  const contentMatch = detail.match(/<div[^>]*class="[^"]*lyrics_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                       detail.match(/<p[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  if (!contentMatch) throw new Error('Megalobiz: no content');
  const raw = contentMatch[1].replace(/<[^>]+>/g, '').trim();
  return { lines: raw.split('\n').map(t => t.trim()).filter(Boolean), name: 'Megalobiz' };
}

/** Syair — scrape lyrics page */
async function fetchSyair(title, artist) {
  const q = `${title} ${artist}`.replace(/[^a-z0-9\s]/gi, '').toLowerCase().replace(/\s+/g, '-');
  const res = await fetch(`https://www.syair.info/search?q=${encodeURIComponent(`${title} ${artist}`)}&maxResults=1`);
  if (!res.ok) throw new Error('Syair: search failed');
  const html = await res.text();
  const linkMatch = html.match(/href="(\/[^"]+?)"[^>]*>.*?${title}/i);
  if (!linkMatch) throw new Error('Syair: no link');
  const cleanHref = linkMatch[1].split('"')[0];
  const detailRes = await fetch(`https://www.syair.info${cleanHref}`);
  if (!detailRes.ok) throw new Error('Syair: detail failed');
  const detail = await detailRes.text();
  const contentMatch = detail.match(/<div[^>]*class="[^"]*post-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (!contentMatch) throw new Error('Syair: no content');
  const raw = contentMatch[1].replace(/<[^>]+>/g, '').trim();
  return { lines: raw.split('\n').map(t => t.trim()).filter(Boolean), name: 'Syair' };
}

function withTimeout(promise, ms, label) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))]);
}

/** Race all providers */
async function raceForLyrics(base44, title, artist) {
  const providers = [
    () => withTimeout(fetchLRCLIB(title, artist), QUICK_TIMEOUT, 'LRCLIB'),
    () => withTimeout(fetchGenius(title, artist), QUICK_TIMEOUT, 'Genius API'),
    () => withTimeout(fetchNetEase(title, artist), QUICK_TIMEOUT, 'NetEase'),
    () => withTimeout(fetchOVH(title, artist), QUICK_TIMEOUT, 'OVH'),
    () => withTimeout(fetchMegalobiz(title, artist), QUICK_TIMEOUT, 'Megalobiz'),
    () => withTimeout(fetchSyair(title, artist), QUICK_TIMEOUT, 'Syair'),
  ];

  try {
    const result = await Promise.any(providers.map(p => p()));
    console.log(`Stage 1 winner: ${result.name} (${result.lines.length} lines)`);
    return result.lines;
  } catch {
    console.warn('All 6 lyrics providers failed — using AI fallback');
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Write ONLY the original Spanish lyrics of "${title}" by ${artist} — exactly as sung in the song, in Spanish. List the lines one per line (each ~40-80 chars). Do NOT include English, do NOT describe the song, do NOT add section labels like (Intro), (Verse), (Chorus) — just the raw Spanish lyrics. If you don't know the exact lyrics, make your best effort in Spanish based on the song's style.`,
      model: 'gemini_3_flash',
    });
    if (aiResponse && aiResponse.length > 80) {
      return aiResponse.split('\n').map(t => t.trim()).filter(Boolean);
    }
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    const song = await base44.entities.Song.get(songId);
    if (!song) return Response.json({ error: 'Song not found' }, { status: 404 });
    const title = song.title, artist = song.artist;

    console.log('Stage 1: racing 6 providers for', title, 'by', artist);
    await base44.entities.Song.update(songId, { sync_status: 'fetching_lyrics' });

    const rawLines = await raceForLyrics(base44, title, artist);

    if (!rawLines || rawLines.length === 0) {
      // Place a friendly fallback line so the page stays functional
      await base44.entities.LyricLine.deleteMany({ song_id: songId }).catch(() => {});
      await base44.entities.LyricLine.bulkCreate([{
        song_id: songId, line_index: 0,
        spanish_text: "Lyrics could not be loaded automatically. Please try resubmitting.",
        pronunciation: '', english_translation: '',
        start_seconds: 0, end_seconds: 0, is_chorus: false,
      }]);
      await base44.entities.Song.update(songId, { sync_status: 'ready_unsynced' });
      return Response.json({ success: true, stage: 1, line_count: 1, fallback: true });
    }

    // Write Spanish lines first — UI renders immediately via realtime
    await base44.entities.LyricLine.deleteMany({ song_id: songId }).catch(() => {});
    await base44.entities.LyricLine.bulkCreate(rawLines.map((text, i) => ({
      song_id: songId, line_index: i,
      spanish_text: text,
      pronunciation: '', english_translation: '',
      start_seconds: 0, end_seconds: 0, is_chorus: false,
    })));
    console.log(`Stage 1 saved ${rawLines.length} raw lines`);

    // Stages 2 (translation) & 3 (timestamps) run in PARALLEL — they write
    // disjoint fields (Stage 2: english_translation/pronunciation/is_chorus;
    // Stage 3: start_seconds/end_seconds), so there is no write conflict.
    await base44.entities.Song.update(songId, { sync_status: 'translating' });
    await Promise.all([
      base44.functions.invoke('translateLyrics', { songId }).catch((e) => console.log('Stage 2 skipped:', e?.message)),
      base44.functions.invoke('syncLyricsAdvanced', { songId }).catch((e) => console.log('Stage 3 skipped:', e?.message)),
    ]);

    return Response.json({ success: true, line_count: rawLines.length });
  } catch (error) {
    console.error('Stage 1 fatal:', error.message);
    await base44.entities.Song.update(req.songId ? req.songId : '', { sync_status: 'failed' }).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});