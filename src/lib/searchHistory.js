import { base44 } from '@/api/base44Client';

/**
 * Upsert a SearchHistory record for the current user + song.
 * Updates the viewed_at timestamp if a record already exists, else creates one.
 */
export async function recordSongView(song) {
  if (!song || !song.id) return;
  try {
    const existing = await base44.entities.SearchHistory.filter({ song_id: song.id }, '-viewed_at', 1);
    const now = new Date().toISOString();
    if (existing && existing.length) {
      await base44.entities.SearchHistory.update(existing[0].id, { viewed_at: now });
    } else {
      await base44.entities.SearchHistory.create({
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist,
        song_youtube_id: song.youtube_id,
        viewed_at: now,
      });
    }
  } catch { /* noop — history is best-effort */ }
}