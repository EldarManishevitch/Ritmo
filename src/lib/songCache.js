import { base44 } from '@/api/base44Client';

// Module-level prefetch cache: Map<songId, { song, lines, at }>
const cache = new Map();
const inflight = new Map();

/** Prefetch a song + its lyric lines into memory (fire on hover/focus). */
export function prefetchSong(songId) {
  if (!songId || cache.has(songId) || inflight.has(songId)) return;
  const p = (async () => {
    try {
      const [song, lines] = await Promise.all([
        base44.entities.Song.get(songId).catch(() => null),
        base44.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500).catch(() => []),
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