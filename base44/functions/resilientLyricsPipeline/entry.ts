import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Entry point for the lyrics pipeline.
 * Responds immediately (~200ms) with { pending: true } and fires the heavy
 * generation work to runLyricsPipeline in the background (fire-and-forget).
 * The Song record is already created client-side; the frontend navigates to
 * /song/:id right away and watches realtime updates as lines stream in.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    // Mark as fetching immediately so the UI shows the right state
    await base44.asServiceRole.entities.Song.update(songId, { sync_status: 'fetching_lyrics' }).catch(() => {});

    // Fire the heavy pipeline in the background (fire-and-forget). The invoke
    // request is sent to the platform before we respond, so the worker runs
    // independently of this function's lifecycle.
    base44.functions.invoke('runLyricsPipeline', { songId })
      .catch((e) => console.log('Worker trigger failed:', e?.message));

    return Response.json({ success: true, pending: true, song_id: songId });
  } catch (error) {
    console.error('Pipeline entry fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});