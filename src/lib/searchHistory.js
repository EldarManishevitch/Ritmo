import { searchHistoryRepo } from '@/data/repositories/searchHistory.repo';

/**
 * Upsert a SearchHistory record for the current user + song.
 * Updates the viewed_at timestamp if a record already exists, else creates one.
 */
export async function recordSongView(song) {
  if (!song || !song.id) return;
  try {
    const existing = await searchHistoryRepo.bySong(song.id, 1);
    const now = new Date().toISOString();
    if (existing && existing.length) {
      await searchHistoryRepo.update(existing[0].id, { viewed_at: now });
    } else {
      await searchHistoryRepo.create({
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist,
        song_youtube_id: song.youtube_id,
        viewed_at: now,
      });
    }
  } catch { /* noop — history is best-effort */ }
}