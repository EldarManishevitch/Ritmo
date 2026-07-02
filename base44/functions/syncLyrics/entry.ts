import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Stage 3: Isolated Timestamp Synchronization with Self-Healing Auto-Retry
 * (Attempt 1 → on failure → Attempt 2 → on success → ready, on failure → ready_unsynced)
 */

/** Scrape an LRC file & align timestamps to our saved lyric lines */
async function alignTimestamps(base44, songId, youtubeId) {
  // Strategy 1: try fetching from public music-recognition/time URL (placeholder approach)
  // We map each line by its content to approximate sync using LRCLIB's timestamp endpoint.

  // The LRCLIB 'get' URL returns either plain or synced lyrics.
  // Try to re-fetch synced LRC (timestamps included).
  const song = await base44.asServiceRole.entities.Song.get(songId);
  if (!song) throw new Error('Song not found');

  const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(song.artist)}&track_name=${encodeURIComponent(song.title)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('LRC fetch: not found');

  const data = await res.json();
  const syncedText = data.syncedLyrics || '';
  const millisecondsDuration = data.duration;
  if (!syncedText && !millisecondsDuration) throw new Error('LRC: no sync data');

  const lines = await base44.asServiceRole.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
  if (!lines.length) throw new Error('No lines to sync');

  if (syncedText) {
    // Parse LRC timestamps: [mm:ss.xx] line text
    const timedLines = [];
    const lrcRegex = /\[(\d+):(\d+)\.\d+\](.*)/g;
    let match;
    while ((match = lrcRegex.exec(syncedText)) !== null) {
      const seconds = parseInt(match[1]) * 60 + parseInt(match[2][0] || '0');
      const text = match[3].trim();
      if (text) timedLines.push({ seconds: Number(seconds), text });
    }

    timedLines.sort((a, b) => a.seconds - b.seconds);

    // Align: fuzzy-match timed lines to our saved lines and assign start/end
    let writtenCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const candidate = timedLines.find((tl, ti) => {
        const refText = lines[i].spanish_text.replace(/[^a-záéíóúñ]/gi, '').toLowerCase();
        return refText && tl.text.toLowerCase().includes(refText.slice(0, 8));
      });
      if (!candidate) continue;

      const start = candidate.seconds;
      const nextTime = timedLines[timedLines.indexOf(candidate) + 1];
      const end = nextTime ? Number(nextTime.seconds) : Number(start + 5);

      await base44.asServiceRole.entities.LyricLine.update(lines[i].id, {
        start_seconds: candidate.seconds,
        end_seconds: end > candidate.seconds ? end : candidate.seconds + 5,
      });
      writtenCount++;
    }

    if (writtenCount / lines.length < 0.3) throw new Error(`LRC alignment: only ${writtenCount}/${lines.length} matched`);
    console.log(`LRC aligned ${writtenCount}/${lines.length} lines`);
    return true;
  }

  if (millisecondsDuration) {
    // Even-duration spread as a graceful baseline (full line = duration / line count)
    const evenlySpaced = millisecondsDuration / lines.length / 1000;
    for (let i = 0; i < lines.length; i++) {
      const start = i * evenlySpaced;
      const end = (i + 1) * evenlySpaced;
      const adjustedEnd = Math.min(Number(end), millisecondsDuration / 1000 + 0.5);
      await base44.asServiceRole.entities.LyricLine.update(lines[i].id, {
        start_seconds: Number(start),
        end_seconds: adjustedEnd,
      });
    }
    console.log('Even-spread sync applied');
    return true;
  }

  throw new Error('No usable timing data available');
}

async function syncWithRetry(base44, songId, youtubeId, attempt = 1) {
  try {
    console.log(`Stage 3 attempt ${attempt}/2`);
    await alignTimestamps(base44, songId, youtubeId);
    await base44.asServiceRole.entities.Song.update(songId, { sync_status: 'ready_synced' });
    console.log('Stage 3 success via attempt', attempt);
    return true;
  } catch (e) {
    console.log(`Stage 3 attempt ${attempt} failed: ${e.message}`);
    if (attempt < 2) return syncWithRetry(base44, songId, youtubeId, attempt + 1);
    // Both attempts failed — graceful fallback
    await base44.asServiceRole.entities.Song.update(songId, { sync_status: 'ready_unsynced' });
    console.log('Stage 3: both attempts failed, song saved as ready_unsynced');
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require an authenticated user before any service-role data modification
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    // Ownership check: only the song creator or an admin can sync lyrics
    const song = await base44.entities.Song.get(songId);
    if (!song) return Response.json({ error: 'Song not found' }, { status: 404 });
    if (song.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Stage 3 sync:', songId);

    const success = await syncWithRetry(base44, songId, song.youtube_id || '');
    return Response.json({ success, stage: 3, synced: success });
  } catch (error) {
    console.error('Stage 3 fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});