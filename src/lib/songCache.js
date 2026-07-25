import { songsRepo } from '@/data/repositories/songs.repo';
import { lyricLinesRepo } from '@/data/repositories/lyricLines.repo';

// Module-level prefetch cache: Map<songId, { song, lines, at }>
const cache = new Map();
const inflight = new Map();

/** Prefetch a song + its lyric lines into memory (fire on hover/focus). */
export function prefetchSong(songId) {
  if (!songId || cache.has(songId) || inflight.has(songId)) return;
  const p = (async () => {
    try {
      const [song, lines] = await Promise.all([
        songsRepo.get(songId).catch(() => null),
        lyricLinesRepo.bySong(songId).catch(() => []),
      ]);
      cache.set(songId, { song, lines: lines || [], at: Date.now() });
    } catch { /* noop */ } finally { inflight.delete(songId); }
  })();
  inflight.set(songId, p);
}

/** Return cached data for a song, or null. */
export function getCachedSong(songId) {
  return cache.get(songId) || null;
}