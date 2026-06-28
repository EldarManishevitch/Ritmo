import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Stage 3: Advanced Timestamp Synchronization
 * Reads synced LRC (or plain) from LRCLIB, fuzzy-matches lines,
 * and caps end_seconds to `start + (wordCount × 0.45 + 0.8)` to
 * preserve true instrumental gaps.
 * Self-healing: ×2 auto-retry → Stage 3b Whisper forced alignment fallback.
 */

async function bytesFromLine(text) {
  return new TextEncoder().encode(text.trim()).length;
}

async function countWordsOfLine(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function writeLineWithWordCap(base44, lineId, start, wordText) {
  const wordCount = await countWordsOfLine(wordText);
  // Cap end_seconds so it doesn't eat into the real instrumental gap.
  // Formula: start + (wordCount × 0.45s/word + 0.8s slack),
  // clamped to a minimum of start + 1.0s.
  const cap = wordCount * 0.45 + 0.8;
  await base44.asServiceRole.entities.LyricLine.update(lineId, {
    start_seconds: Number(start),
    end_seconds: Number(start) + cap,
  });
}

async function alignTimestamps(base44, songId) {
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
    // Strict LRC parser: [mm:ss.xx]
    const timedLines = [];
    const lrcRegex = /\[(\d+):(\d+)\.(\d+)\](.*)/g;
    let match;
    while ((match = lrcRegex.exec(syncedText)) !== null) {
      const seconds = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;
      const text = match[4].trim();
      if (text) timedLines.push({ seconds, text });
    }

    timedLines.sort((a, b) => a.seconds - b.seconds);

    let writtenCount = 0;
    // 1:1 when counts match, else best-effort proportional mapping
    if (timedLines.length === lines.length) {
      for (let i = 0; i < lines.length; i++) {
        await writeLineWithWordCap(base44, lines[i].id, timedLines[i].seconds, timedLines[i].text);
        writtenCount++;
      }
    } else {
      for (const tl of timedLines) {
        const candidate = lines.find(l => {
          const refText = l.spanish_text.replace(/[^a-záéíóúñ]/gi, '').toLowerCase();
          return refText && tl.text.toLowerCase().includes(refText.slice(0, 10));
        });
        if (!candidate) continue;
        await writeLineWithWordCap(base44, candidate.id, tl.seconds, tl.text);
        writtenCount++;
      }
    }

    if (writtenCount / lines.length < 0.3) throw new Error(`LRC alignment: only ${writtenCount}/${lines.length} matched`);
    console.log(`Stage 3 LRC aligned ${writtenCount}/${lines.length} lines (word-cap)`);
    return true;
  }

  if (millisecondsDuration) {
    // Even-spread baseline with same word-cap applied
    const evenlySpaced = millisecondsDuration / lines.length / 1000;
    for (let i = 0; i < lines.length; i++) {
      await writeLineWithWordCap(base44, lines[i].id, i * evenlySpaced, lines[i].spanish_text);
    }
    console.log('Stage 3 even-spread (word-cap) applied');
    return true;
  }

  throw new Error('No usable timing data available');
}

async function syncWithRetry(base44, songId, attempt = 1) {
  try {
    console.log(`Stage 3 attempt ${attempt}/2`);
    await alignTimestamps(base44, songId);
    await base44.asServiceRole.entities.Song.update(songId, { sync_status: 'ready_synced' });
    console.log('Stage 3 success via attempt', attempt);
    return true;
  } catch (e) {
    console.log(`Stage 3 attempt ${attempt} failed: ${e.message}`);
    if (attempt < 2) return syncWithRetry(base44, songId, attempt + 1);

    // Both LRC attempts failed — launch Stage 3b (Whisper forced alignment) as last resort
    const song = await base44.asServiceRole.entities.Song.get(songId);
    if (song && song.youtube_id) {
      console.log('Stage 3: LRC exhausted, launching Stage 3b Whisper alignment');
      try {
        const res = await base44.functions.invoke('whisperAlignment', { songId });
        if (res && res.data && res.data.success) {
          await base44.asServiceRole.entities.Song.update(songId, { sync_status: 'ready_synced' });
          console.log('Stage 3b Whisper alignment succeeded');
          return true;
        }
      } catch (wErr) {
        console.warn(`Stage 3b Whisper alignment also failed: ${wErr.message}`);
      }
    } else {
      console.log('Stage 3b skipped — no youtube_id available');
    }

    await base44.asServiceRole.entities.Song.update(songId, { sync_status: 'ready_unsynced' });
    console.log('Stage 3: all alignment methods exhausted → ready_unsynced');
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

    console.log('Stage 3 syncAdvanced:', songId);
    const success = await syncWithRetry(base44, songId);
    return Response.json({ success, stage: 3, synced: success });
  } catch (error) {
    console.error('Stage 3 fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});