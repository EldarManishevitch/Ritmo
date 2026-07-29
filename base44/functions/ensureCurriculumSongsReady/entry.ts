import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Checks all curriculum track songs + catalog default songs and triggers the
 * lyrics pipeline for any in a pending/failed/stuck state. Idempotent — only
 * triggers songs that actually need it; skips songs that are already ready.
 *
 * Called by:
 * 1. The admin curriculum-health page (manual trigger)
 * 2. The "Curriculum Song Auto-Repair" workflow (entity trigger on CurriculumTrack)
 */

const READY_STATES = ['ready', 'ready_synced', 'ready_unsynced', 'static'];
const NEEDS_TRIGGER = ['pending', 'failed', 'failed_permanent', 'fetching_lyrics', 'translating'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const sb = base44.asServiceRole;

    // Collect all required song IDs from curriculum tracks + catalog defaults
    const tracks = await sb.entities.CurriculumTrack.list('-cefr_level', 50);
    const requiredIds = new Set();
    for (const track of (tracks || [])) {
      for (const id of (track.song_ids || [])) requiredIds.add(id);
    }

    const catalogSongs = await sb.entities.Song.filter({ is_catalog_default: true }, '-created_date', 500);
    for (const s of (catalogSongs || [])) requiredIds.add(s.id);

    const triggered = [];
    let readyCount = 0;

    for (const songId of requiredIds) {
      const song = await sb.entities.Song.get(songId).catch(() => null);
      if (!song) continue;

      if (!NEEDS_TRIGGER.includes(song.sync_status)) {
        if (READY_STATES.includes(song.sync_status)) readyCount++;
        continue;
      }

      // Reset and trigger the pipeline (fire-and-forget, staggered)
      await sb.entities.Song.update(songId, { sync_status: 'pending', retry_count: 0 }).catch(() => {});
      base44.functions.invoke('runLyricsPipeline', { songId }).catch(() => {});
      triggered.push({ id: songId, title: song.title, artist: song.artist });
      await new Promise((r) => setTimeout(r, 300));
    }

    return Response.json({
      success: true,
      checked: requiredIds.size,
      triggered: triggered.length,
      already_ready: readyCount,
      triggered_songs: triggered,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}