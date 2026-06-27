import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = (body.query || '').trim();
    if (!query) return Response.json({ error: 'Query required' }, { status: 400 });

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!resp.ok) return Response.json({ error: data.error?.message || 'YouTube API error' }, { status: 502 });
    if (!data.items || !data.items.length) return Response.json({ error: 'No video found' }, { status: 404 });

    const videos = data.items.map((it) => ({
      youtube_id: it.id.videoId,
      title: it.snippet.title,
      artist: it.snippet.channelTitle,
      thumbnail_url: `https://i.ytimg.com/vi/${it.id.videoId}/hqdefault.jpg`,
    }));

    // Drop "Official Video" titles (case-insensitive) to favor audio/lyric versions for time-syncing
    const filteredVideos = videos.filter((video) => !video.title.toLowerCase().includes('official video'));
    const item = filteredVideos.length > 0 ? filteredVideos[0] : videos[0];
    return Response.json(item);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});