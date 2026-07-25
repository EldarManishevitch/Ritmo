import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Admin utility: syncs lyrics timestamps for songs that are ready_unsynced.
 * Invokes syncLyricsAdvanced (Stage 3) for each, which tries LRCLIB alignment
 * first, then Whisper forced alignment as fallback.
 *
 * Processes in batches to stay within function timeout. Call repeatedly until
 * all songs are synced.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 3;

    const sb = base44.asServiceRole;
    const all = await sb.entities.Song.list('-created_date', 500);
    const unsynced = all.filter((s) => s.sync_status === 'ready_unsynced');
    const batch = unsynced.slice(0, batchSize);

    // Process sequentially to avoid rate limits from parallel entity operations
    const synced = [];
    const failed = [];
    for (const song of batch) {
      try {
        const res = await base44.functions.invoke('syncLyricsAdvanced', { songId: song.id });
        if (res?.data?.synced) {
          synced.push(song.title);
        } else {
          failed.push({ title: song.title, success: false });
        }
      } catch (e) {
        failed.push({ title: song.title, success: false, error: e?.message });
      }
      // Small delay between songs to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    return Response.json({
      totalUnsynced: unsynced.length,
      processed: batch.length,
      syncedCount: synced.length,
      failedCount: failed.length,
      synced,
      failed,
      remaining: unsynced.length - batch.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});