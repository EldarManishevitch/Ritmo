import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * One-time admin seeder: triggers the full lyrics pipeline (fetch + translate +
 * sync) for every catalog song that isn't already ready, so songs open
 * instantly with lyrics/translation/sync pre-populated — no on-demand loading.
 *
 * Fires runLyricsPipeline fire-and-forget (staggered) and responds immediately;
 * the pipelines complete in the background over the following minutes.
 * Idempotent: re-running skips songs that are already ready.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const sb = base44.asServiceRole;
    const all = await sb.entities.Song.list('-created_date', 500);
    const DONE = ['ready', 'ready_synced', 'ready_unsynced', 'static'];
    const pending = all.filter((s) => s.is_catalog_default && !DONE.includes(s.sync_status));

    // Reset stuck / failed songs so the pipeline re-runs cleanly from Stage 1
    for (const s of pending) {
      await sb.entities.Song.update(s.id, { sync_status: 'pending', retry_count: 0 }).catch(() => {});
    }

    // Fire-and-forget runLyricsPipeline for each, staggered to avoid bursts.
    // Each invoke spawns an independent background worker (same pattern as
    // resilientLyricsPipeline) so this function can respond immediately.
    for (const s of pending) {
      base44.functions.invoke('runLyricsPipeline', { songId: s.id })
        .catch((e) => console.log(`Trigger failed for ${s.title}:`, e?.message));
      await new Promise((r) => setTimeout(r, 300));
    }

    return Response.json({
      success: true,
      triggered: pending.length,
      songs: pending.map((s) => ({ id: s.id, title: s.title, artist: s.artist })),
    });
  } catch (error) {
    console.error('seedCatalogLyrics fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});