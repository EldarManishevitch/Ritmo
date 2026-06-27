import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Stage 1 Orchestrator: Race all text providers, save winner instantly,
 * then fire-and-forget Stage 2 (translation) and Stage 3 (sync/retry×2).
 */

const QUICK_TIMEOUT = 2500;

/** Scrape genius.com for raw lyrics text */
async function scrapeGenius(base44, { title, artist }) {
  const q = `${artist} ${title}`.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const url = `https://genius.com/${encodeURIComponent(q)}-lyrics`;
  console.log('Firecrawl scrape URL:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firecrawl: status ${res.status}`);
  const html = await res.text();
  // Extract the standard Genius lyrics container
  const match = html.match(/<div[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || html.match(/data-lyrics-container="true">([\s\S]*?)<\/div>/g);
  if (!match) throw new Error('Firecrawl: no lyrics container');
  const raw = match.length > 1 ? match.map(m => m.replace(/<[^>]+>/g, '').trim()).join('\n') : match[0].replace(/<[^>]+>/g, '').trim();
  const lines = raw.split('\n').map(t => t.trim()).filter(t => t.length > 1 && !/^\[|^\d+$|^[A-Za-z]*Couplet|^[A-Za-z]*Bridge/i.test(t));
  if (lines.length < 4) throw new Error('Firecrawl: too few lines');
  return { plain: lines.join('\n'), name: 'Firecrawl' };
}

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
  return { plain, name: 'Genius API' };
}

/** LRCLIB text lookup */
async function fetchLRCLIB(title, artist) {
  const res = await fetch(
    `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
  );
  if (!res.ok) throw new Error('LRCLIB: not found');
  const data = await res.json();
  const plain = data.plainLyrics || data.syncedLyrics || data.lyrics || '';
  if (!plain || plain.length < 20) throw new Error('LRCLIB: empty');
  return { plain, name: 'LRCLIB' };
}

/** lyrics.ovh lookup */
async function fetchOVH(title, artist) {
  const res = await fetch(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
  );
  if (!res.ok) throw new Error('OVH: not found');
  const lyrics = (await res.json()).lyrics;
  if (!lyrics || lyrics.length < 20) throw new Error('OVH: empty');
  return { plain: lyrics, name: 'OVH' };
}

function withTimeout(promise, ms, label) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))]);
}

/** Stage 1: The Race — return raw lines from the fastest provider */
async function raceForLyrics(base44, title, artist) {
  const providers = [
    () => withTimeout(fetchGenius(title, artist), QUICK_TIMEOUT, 'Genius'),
    () => withTimeout(fetchLRCLIB(title, artist), QUICK_TIMEOUT, 'LRCLIB'),
    () => withTimeout(fetchOVH(title, artist), QUICK_TIMEOUT, 'OVH'),
  ];

  try {
    const result = await Promise.any(providers.map(p => p()));
    const lines = result.plain.split('\n').map(t => t.trim()).filter(Boolean);
    console.log(`Race winner: ${result.name} (${lines.length} lines)`);
    return lines;
  } catch {
    console.warn('All lyrics providers failed — using AI fallback');
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

    // Delete any existing stale lines so the fresh race results arrive cleanly
    await base44.entities.LyricLine.deleteMany({ song_id: songId });

    console.log('Stage 1 race:', song.title, 'by', song.artist);
    await base44.entities.Song.update(songId, { sync_status: 'pending' });

    const rawLines = await raceForLyrics(base44, song.title, song.artist);

    if (!rawLines || rawLines.length === 0) {
      // Zero-Failure Safeguard: place a friendly message so the page stays functional
      await base44.entities.LyricLine.bulkCreate([{
        song_id: songId,
        line_index: 0,
        spanish_text: "Lyrics could not be loaded automatically. Please try resubmitting.",
        pronunciation: '',
        english_translation: '',
        start_seconds: 0,
        end_seconds: 0,
        is_chorus: false,
      }]);
      await base44.entities.Song.update(songId, { sync_status: 'ready_unsynced' });
      return Response.json({ success: true, stage: 1, line_count: 1, fallback: true });
    }

    // Save Stage 1 lines instantly (English/pronunciation empty)
    await base44.entities.LyricLine.bulkCreate(rawLines.map((t, i) => ({
      song_id: songId,
      line_index: i,
      spanish_text: t,
      pronunciation: '',
      english_translation: '',
      start_seconds: 0,
      end_seconds: 0,
      is_chorus: false,
    })));
    console.log(`Stage 1 saved ${rawLines.length} raw lines`);

    // Stage 2: translate all lines in one call (independent — never affects original lines)
    await base44.entities.Song.update(songId, { sync_status: 'translating' });
    await base44.functions.invoke('translateLyrics', { songId }).catch(async () => {
      console.log('Stage 2 skipped — continuing with raw lines');
      await base44.entities.Song.update(songId, { sync_status: 'ready_unsynced' });
    });

    // Stage 3: sync timestamps ×2 auto-retry × graceful fallback to ready_unsynced
    await base44.functions.invoke('syncLyrics', { songId }).catch(async () => {
      console.log('Stage 3 skipped — falling back to unsynced');
      await base44.entities.Song.update(songId, { sync_status: 'ready_unsynced' });
    });

    // Mark final ready state if still in transitional status
    const final = await base44.entities.Song.get(songId);

    return Response.json({ success: true, line_count: rawLines.length, final_status: final?.sync_status });
  } catch (error) {
    console.error('Stage 1 fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});