import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    // Reset song status to fetching_lyrics to trigger the pipeline again
    await base44.entities.Song.update(songId, { sync_status: 'fetching_lyrics' });

    // Trigger the lyrics generation pipeline
    await base44.functions.invoke('generateLyrics', { songId });

    return Response.json({ success: true, message: 'Resync triggered' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});