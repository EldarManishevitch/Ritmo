import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fetch with a hard timeout so a hanging source can't stall the parallel race.
async function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------- LRCLIB ----------
async function fetchLrclib(title, artist) {
  try {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    const res = await fetchWithTimeout(url);
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

// ---------- Genius (parallel query variants, first hit wins) ----------
function extractGeniusLyrics(html) {
  const re = /<div[^>]*data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
  const sections = [];
  let m;
  while ((m = re.exec(html)) !== null) sections.push(m[1]);
  if (sections.length === 0) return null;
  return sections
    .join('\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchGenius(title, artist) {
  try {
    const token = Deno.env.get('GENIUS_ACCESS_TOKEN');
    if (!token) return null;

    // Build all candidate queries up-front and race them — first non-null wins.
    const queries = [`${title} ${artist}`, title, `${artist} ${title}`];
    const settled = await Promise.allSettled(
      queries.map(async (q) => {
        const resp = await fetchWithTimeout(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error('genius search failed');
        const data = await resp.json();
        const hit = data.response?.hits?.find(
          (h) => h.type === 'song' &&
            !/compilation|awards|tracklist/i.test(h.result.title || '')
        );
        if (!hit) throw new Error('no hit');
        return hit.result;
      })
    );
    const song = settled.find((s) => s.status === 'fulfilled')?.value;
    if (!song) return null;

    const pageResp = await fetchWithTimeout(`https://genius.com${song.path}`);
    if (!pageResp.ok) return null;
    const html = await pageResp.text();
    const plainLyrics = extractGeniusLyrics(html);
    console.log(`genius: ${plainLyrics ? 'lyrics found' : 'no lyrics extracted'} for "${song.title}"`);
    return plainLyrics ? { plainLyrics, syncedLyrics: null } : null;
  } catch {
    return null;
  }
}

// ---------- Lyrics.ovh (plain text, no auth) ----------
async function fetchLyricsOvh(title, artist) {
  try {
    if (!artist) return null;
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const plain = (await res.json())?.lyrics?.trim();
    return plain ? { syncedLyrics: null, plainLyrics: plain } : null;
  } catch {
    return null;
  }
}

// ---------- NetEase (synced LRC, no auth) ----------
async function fetchNetEase(title, artist) {
  try {
    const query = artist ? `${title} ${artist}` : title;
    const searchRes = await fetchWithTimeout(
      `https://music.163.com/api/search/pc?s=${encodeURIComponent(query)}&type=1&offset=0&limit=5`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com' } }
    );
    if (!searchRes.ok) return null;
    const songs = (await searchRes.json())?.result?.songs;
    if (!Array.isArray(songs) || !songs.length) return null;
    const lyricRes = await fetchWithTimeout(
      `https://music.163.com/api/song/lyric?os=pc&id=${songs[0].id}&lv=-1&kv=-1&tv=-1`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com' } }
    );
    if (!lyricRes.ok) return null;
    const synced = (await lyricRes.json())?.lrc?.lyric?.trim();
    return synced ? { syncedLyrics: synced, plainLyrics: null } : null;
  } catch {
    return null;
  }
}

// Strip [mm:ss.xx] timestamp + metadata tags from synced LRC to derive plain lyrics.
function stripTimestamps(lrc) {
  if (!lrc) return null;
  const plain = lrc
    .replace(/\[(\d{1,2}):(\d{2})(?:[.:]\d{1,3})?\]/g, '')
    .replace(/^\s*\[[a-z]+:[^\]]*\]\s*$/gim, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
  return plain || null;
}

// ---------- Megalobiz (synced LRC, best-effort HTML scrape, no auth) ----------
async function fetchMegalobiz(title, artist) {
  try {
    const query = artist ? `${title} ${artist}` : title;
    const searchRes = await fetchWithTimeout(
      `https://www.megalobiz.com/lrc/search?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!searchRes.ok) return null;
    const searchHtml = await searchRes.text();
    const linkMatch = searchHtml.match(/\/lrc\/maker\/[^"'\s<>]+/i);
    if (!linkMatch) return null;
    const pageRes = await fetchWithTimeout(`https://www.megalobiz.com${linkMatch[0]}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!pageRes.ok) return null;
    const pageHtml = await pageRes.text();
    const lrcMatch = pageHtml.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
    const lrc = lrcMatch ? lrcMatch[1].trim() : null;
    if (!lrc || !/\[\d{1,2}:\d{2}/.test(lrc)) return null;
    return { syncedLyrics: lrc, plainLyrics: null };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { title, artist } = body;
    if (!title) return Response.json({ error: 'Title required' }, { status: 400 });

    // Race all 4 sources concurrently. Each is isolated — a failure or timeout
    // can't stall the others. Resolve the moment a synced result lands; if only
    // plain text arrives, give synced a short grace window (2s) then resolve so
    // the user sees the original-language lyrics fast instead of waiting on
    // slow sources.
    const results = {};
    let resolveRace;
    const raceDone = new Promise((r) => { resolveRace = r; });
    let graceTimer = null;
    const haveSynced = () => Object.values(results).some((v) => v?.syncedLyrics);

    const publish = (name, v) => {
      results[name] = v;
      if (v?.syncedLyrics) {
        if (graceTimer) clearTimeout(graceTimer);
        resolveRace();
      } else if (v?.plainLyrics && !graceTimer && !haveSynced()) {
        graceTimer = setTimeout(resolveRace, 2000);
      }
      return v;
    };

    const all = Promise.allSettled([
      fetchLrclib(title, artist || '').then((v) => publish('lrclib', v)),
      fetchGenius(title, artist || '').then((v) => publish('genius', v)),
      fetchLyricsOvh(title, artist || '').then((v) => publish('ovh', v)),
      fetchNetEase(title, artist || '').then((v) => publish('netease', v)),
      fetchMegalobiz(title, artist || '').then((v) => publish('megalobiz', v)),
    ]);
    all.then(() => { if (graceTimer) clearTimeout(graceTimer); resolveRace(); });

    await Promise.race([raceDone, all]);

    const syncedLyrics = Object.values(results).find((v) => v?.syncedLyrics)?.syncedLyrics || null;
    // Plain-text pool: direct plain sources, plus timestamp-stripped text derived
    // from any synced LRC source (lrclib, netEase, megalobiz) as a fallback.
    const plainLyrics =
      results.genius?.plainLyrics ||
      results.ovh?.plainLyrics ||
      results.lrclib?.plainLyrics ||
      stripTimestamps(syncedLyrics) ||
      null;

    console.log(`lyrics race: lrclib=${!!results.lrclib} genius=${!!results.genius} ovh=${!!results.ovh} netease=${!!results.netease} megalobiz=${!!results.megalobiz} synced=${!!syncedLyrics}`);

    return Response.json({
      syncedLyrics,
      plainLyrics,
      sources: {
        lrclib: !!results.lrclib,
        genius: !!results.genius,
        ovh: !!results.ovh,
        netease: !!results.netease,
        megalobiz: !!results.megalobiz,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});