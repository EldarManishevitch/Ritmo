import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });

    const songs = await base44.asServiceRole.entities.Song.list('-created_date', 500);

    const hasArt = (s) => s.album_art_url && s.album_art_url.trim();
    const needsWork = songs.filter((s) => !hasArt(s));

    let filled = 0;
    let searched = 0;
    const processed = [];

    for (const song of needsWork) {
      let youtubeId = song.youtube_id;

      // No video id → research the real song on YouTube
      if (!youtubeId) {
        searched += 1;
        const query = `${song.title} ${song.artist} official`;
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${apiKey}`;
        const resp = await fetch(url);
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data.items && data.items.length) {
          youtubeId = data.items[0].id.videoId;
        }
      }

      if (youtubeId) {
        await base44.asServiceRole.entities.Song.update(song.id, {
          youtube_id: youtubeId,
          album_art_url: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        });
        filled += 1;
        processed.push({ title: song.title, youtube_id: youtubeId });
      }
    }

    return Response.json({ total_missing: needsWork.length, searched, filled, processed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});