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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { title, artist } = body;
    if (!title) return Response.json({ error: 'Title required' }, { status: 400 });

    // Race LRCLIB + Genius concurrently
    const [lrclibRes, geniusRes] = await Promise.allSettled([
      fetchLrclib(title, artist || ''),
      fetchGenius(title, artist || ''),
    ]);
    const lrclib = lrclibRes.status === 'fulfilled' ? lrclibRes.value : null;
    const genius = geniusRes.status === 'fulfilled' ? geniusRes.value : null;

    console.log(`lyrics race: lrclib=${!!lrclib} genius=${!!genius}`);

    // Prefer synced lyrics (LRCLIB only), then plain text (LRCLIB > Genius)
    const syncedLyrics = lrclib?.syncedLyrics || null;
    const plainLyrics = lrclib?.plainLyrics || genius?.plainLyrics || null;

    return Response.json({
      syncedLyrics,
      plainLyrics,
      sources: { lrclib: !!lrclib, genius: !!genius },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});