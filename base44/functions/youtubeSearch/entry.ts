import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = (body.query || '').trim();
    const language = (body.language || 'Spanish').trim();
    if (!query) return Response.json({ error: 'Query required' }, { status: 400 });

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });

    // Add language context to the YouTube search so results are relevant to the target language
    const enhancedQuery = language === 'Spanish' ? query
      : `${query} ${language} song`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(enhancedQuery)}&key=${apiKey}`;
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

    const filteredVideos = videos.filter((video) => {
      // Keep Spanish results as-is; for other languages, filter loosely
      const lower = video.title.toLowerCase();
      return language === 'Spanish' ? !lower.includes('official video') : true;
    });
    // Drop "Official Video" titles (case-insensitive) to favor audio/lyric versions for time-syncing.
    // Keep them only if filtering would empty the list.
    const finalVideos = filteredVideos.length > 0 ? filteredVideos : videos;
    return Response.json(finalVideos.slice(0, 5));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});