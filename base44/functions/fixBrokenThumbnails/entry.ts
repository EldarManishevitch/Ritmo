import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Admin utility: finds songs whose YouTube thumbnail 404s (wrong/invalid video ID),
 * searches YouTube for the correct video, and updates youtube_id + album_art_url.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });

    const songs = await base44.asServiceRole.entities.Song.list('-created_date', 500);

    // Identify songs with broken thumbnails (HTTP 404 or tiny blank placeholder)
    const broken = [];
    for (const song of songs) {
      const yid = song.youtube_id;
      if (!yid) { broken.push(song); continue; }
      try {
        const res = await fetch(`https://img.youtube.com/vi/${yid}/hqdefault.jpg`, { method: 'GET' });
        if (!res.ok) broken.push(song);
      } catch {
        broken.push(song);
      }
    }

    const fixed = [];
    const failed = [];

    for (const song of broken) {
      try {
        const query = `${song.title} ${song.artist} official`;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${apiKey}`;
        const searchResp = await fetch(searchUrl);
        const searchData = await searchResp.json().catch(() => ({}));

        if (!searchResp.ok || !searchData.items || !searchData.items.length) {
          failed.push({ title: song.title, reason: 'No YouTube results' });
          continue;
        }

        // Pick the first result (most relevant)
        const newId = searchData.items[0].id.videoId;
        const newArt = `https://i.ytimg.com/vi/${newId}/hqdefault.jpg`;

        await base44.asServiceRole.entities.Song.update(song.id, {
          youtube_id: newId,
          album_art_url: newArt,
        });

        fixed.push({ title: song.title, oldId: song.youtube_id, newId, newArt });
      } catch (err) {
        failed.push({ title: song.title, reason: err.message });
      }
    }

    return Response.json({
      totalChecked: songs.length,
      brokenCount: broken.length,
      fixedCount: fixed.length,
      fixed,
      failed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});