// Spec 1.3: "Service worker caches lyrics/translation JSON for any song the user
// has opened. Reopening a song should be instant and work offline."
//
// The actual HTTP layer here is the closed-source @base44/sdk client, so a
// service-worker fetch handler can't reliably pattern-match its requests without
// risking silent breakage of realtime pipeline updates. Instead we cache at the
// layer we control — the already-fetched LyricLine array — using the Cache
// Storage API (the same storage primitive service workers use under the hood).
// Entries persist across reloads and are readable with no network at all, which
// is what makes reopening instant and offline-capable.

const CACHE_NAME = 'ritmo-lyrics-v1';
const cacheKey = (songId) => `https://cache.local/lyrics/${songId}`;

function cachesAvailable() {
  return typeof caches !== 'undefined';
}

/** Returns the cached lines array for a song, or null if not cached / unavailable. */
export async function getCachedLines(songId) {
  if (!cachesAvailable() || !songId) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match(cacheKey(songId));
    if (!res) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fire-and-forget: store/refresh the cached lines for a song. */
export async function setCachedLines(songId, lines) {
  if (!cachesAvailable() || !songId || !Array.isArray(lines) || !lines.length) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(cacheKey(songId), new Response(JSON.stringify(lines), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch { /* noop */ }
}
