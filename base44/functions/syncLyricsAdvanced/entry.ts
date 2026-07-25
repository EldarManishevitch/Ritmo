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

function computeLineUpdate(lineId, start, wordText) {
  const wordCount = wordText.trim().split(/\s+/).filter(Boolean).length;
  const cap = wordCount * 0.45 + 0.8;
  return { id: lineId, start_seconds: Number(start), end_seconds: Number(start) + cap };
}

function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase();
}

async function alignTimestamps(base44, songId) {
  const song = await base44.asServiceRole.entities.Song.get(songId);
  if (!song) throw new Error('Song not found');

  // Try full artist first, then simplified (without "ft." / "&" collaborators)
  const artistVariants = [song.artist];
  const simpleArtist = song.artist.split(/\s+(?:ft\.?|feat\.?|&)\s+/i)[0].trim();
  if (simpleArtist && simpleArtist !== song.artist) artistVariants.push(simpleArtist);

  let data = null;
  for (const artistName of artistVariants) {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(song.title)}`;
    const res = await fetch(url);
    if (res.ok) {
      data = await res.json();
      if (data && (data.syncedLyrics || data.duration)) break;
    }
  }
  if (!data) throw new Error('LRC fetch: not found');

  const syncedText = data.syncedLyrics || '';
  const millisecondsDuration = data.duration;
  if (!syncedText && !millisecondsDuration) throw new Error('LRC: no sync data');

  const lines = await base44.asServiceRole.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
  if (!lines.length) throw new Error('No lines to sync');

  if (syncedText) {
    // LRC parser: [mm:ss.xx] or [mm:ss.xxx]
    const timedLines = [];
    const lrcRegex = /\[(\d+):(\d+)[.:](\d+)\](.*)/g;
    let match;
    while ((match = lrcRegex.exec(syncedText)) !== null) {
      const frac = match[3];
      const divisor = frac.length === 3 ? 1000 : 100;
      const seconds = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(frac) / divisor;
      const text = match[4].trim();
      if (text) timedLines.push({ seconds, text });
    }

    timedLines.sort((a, b) => a.seconds - b.seconds);

    const normStored = lines.map(l => normalizeText(l.spanish_text));
    const updates = [];
    let writtenCount = 0;

    if (timedLines.length === lines.length) {
      // 1:1 mapping
      for (let i = 0; i < lines.length; i++) {
        updates.push(computeLineUpdate(lines[i].id, timedLines[i].seconds, timedLines[i].text));
        writtenCount++;
      }
    } else {
      // Normalized text matching with accent/punctuation stripping
      const matched = new Set();
      for (const tl of timedLines) {
        const normLrc = normalizeText(tl.text);
        if (!normLrc || normLrc.length < 3) continue;

        let bestIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (matched.has(i)) continue;
          const ns = normStored[i];
          if (!ns || ns.length < 3) continue;

          const prefixLen = Math.min(6, ns.length, normLrc.length);
          if (prefixLen < 3) continue;

          if (normLrc.includes(ns.slice(0, prefixLen)) || ns.includes(normLrc.slice(0, prefixLen))) {
            bestIdx = i;
            break;
          }
        }

        if (bestIdx >= 0) {
          matched.add(bestIdx);
          updates.push(computeLineUpdate(lines[bestIdx].id, tl.seconds, tl.text));
          writtenCount++;
        }
      }

      // If text matching was poor, fall back to proportional position mapping
      if (writtenCount / lines.length < 0.3) {
        console.log(`Stage 3 text matching only ${writtenCount}/${lines.length}, using proportional mapping`);
        updates.length = 0;
        writtenCount = 0;
        for (let i = 0; i < lines.length; i++) {
          const lrcIdx = Math.min(timedLines.length - 1, Math.floor(i * timedLines.length / lines.length));
          updates.push(computeLineUpdate(lines[i].id, timedLines[lrcIdx].seconds, timedLines[lrcIdx].text));
          writtenCount++;
        }
      }
    }

    if (writtenCount / lines.length < 0.3) throw new Error(`LRC alignment: only ${writtenCount}/${lines.length} matched`);

    // Single bulkUpdate instead of N individual updates — avoids rate limiting
    await base44.asServiceRole.entities.LyricLine.bulkUpdate(updates);
    console.log(`Stage 3 LRC aligned ${writtenCount}/${lines.length} lines (bulk update)`);
    return true;
  }

  if (millisecondsDuration) {
    // Even-spread baseline with same word-cap applied
    const evenlySpaced = millisecondsDuration / lines.length / 1000;
    const updates = lines.map((l, i) => computeLineUpdate(l.id, i * evenlySpaced, l.spanish_text));
    await base44.asServiceRole.entities.LyricLine.bulkUpdate(updates);
    console.log('Stage 3 even-spread (bulk update) applied');
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

    // Ownership check: only the song creator or an admin can sync lyrics
    const song = await base44.entities.Song.get(songId);
    if (!song) return Response.json({ error: 'Song not found' }, { status: 404 });
    if (song.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Stage 3 syncAdvanced:', songId);
    const success = await syncWithRetry(base44, songId);
    return Response.json({ success, stage: 3, synced: success });
  } catch (error) {
    console.error('Stage 3 fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});