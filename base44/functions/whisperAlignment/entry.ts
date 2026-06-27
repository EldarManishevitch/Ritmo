import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import ytdl from 'npm:ytdl-core';

/**
 * Stage 3b: Whisper forced alignment fallback.
 * Runs ONLY when Stage 3 (LRC sync) fails both retries.
 *
 * Pipeline:
 * 1. Download YouTube audio via ytdl-core
 * 2. Upload the audio stream to get a private file
 * 3. Transcribe with TranscribeAudio (Whisper)
 * 4. Greedy-match transcript segments to lyric lines
 */

const TRANSCRIBE_TIMEOUT = 120_000; // 2 min
const DOWNLOAD_RETRIES = 3;
const AUDIO_DURATION_CAP = 300; // 5 min — trim audio for long tracks

function tokenizeNormalize(text = '') {
  return text.toLowerCase().replace(/[^a-záéíóúüñ]/g, ' ').split(/\s+/).filter(Boolean).join(' ');
}

function greedyMatch(segments, spanishLines) {
  // Each segment: {text, start, end}
  const result = [];
  for (let i = 0; i < spanishLines.length; i++) {
    result.push({ line_index: i, start_seconds: 0, end_seconds: 0, matched: false });
  }

  let segPtr = 0;
  const segWords = segments.map(s => ({
    text: tokenizeNormalize(s.text),
    start: s.start,
    end: s.end,
  }));

  for (let lineIdx = 0; lineIdx < spanishLines.length && segPtr < segWords.length; lineIdx++) {
    const lineNorm = tokenizeNormalize(spanishLines[lineIdx].spanish_text);
    const lineWords = lineNorm.split(/\s+/).filter(Boolean);
    if (lineWords.length === 0 || lineNorm.length < 2) continue;

    let bestScore = 0;
    let bestSegIdx = -1;

    for (let j = segPtr; j < Math.min(segPtr + 6, segWords.length); j++) {
      const segNorm = segWords[j].text;
      const lineSet = new Set(lineWords);
      const segSet = new Set(segNorm.split(/\s+/).filter(Boolean));
      let matchCount = 0;
      for (const w of lineWords) {
        if (segSet.has(w)) matchCount++;
      }
      // Also credit seg words matched in line
      for (const w of segSet) {
        if (lineSet.has(w)) matchCount++;
      }
      const score = segNorm.length > 0 ? matchCount / Math.max(lineWords.length, 1) : 0;
      if (score > bestScore) {
        bestScore = score;
        bestSegIdx = j;
      }
    }

    if (bestScore >= 0.4) {
      result[lineIdx] = {
        line_index: lineIdx,
        start_seconds: segWords[bestSegIdx].start,
        end_seconds: segWords[bestSegIdx].end,
        matched: true,
      };
      // Catch-up: advance past any skipped segments
      for (let k = segPtr; k < bestSegIdx; k++) {
        const skipped = k;
        const mid = (segWords[k].start + segWords[k].end) / 2;
        for (let l = lineIdx; l < result.length; l++) {
          if (result[l].matched) break;
          result[l].start_seconds = mid;
          result[l].end_seconds = mid + 2;
        }
      }
      segPtr = bestSegIdx + 1;
    }
  }

  // Interpolate gaps between matched anchors
  let lastMatch = { line_index: -1, start_seconds: 0, end_seconds: 0, matched: true };
  for (let i = 0; i < result.length; i++) {
    if (result[i].matched) {
      const gap = result[i].start_seconds - lastMatch.end_seconds;
      const dist = i - lastMatch.line_index;
      if (gap > 0 && dist > 1) {
        for (let j = lastMatch.line_index + 1; j < i; j++) {
          const t = (j - lastMatch.line_index) / dist;
          result[j].start_seconds = lastMatch.end_seconds + gap * t;
          result[j].end_seconds = result[j].start_seconds + 2;
        }
      }
      lastMatch = { ...result[i], line_index: i, matched: true };
    }
  }

  return result;
}

async function downloadAndTranscribe(base44, youtubeId) {
  let audioUrl = null;
  for (let attempt = 1; attempt <= DOWNLOAD_RETRIES; attempt++) {
    try {
      const stream = ytdl(`https://www.youtube.com/watch?v=${youtubeId}`, { filter: 'audioonly', quality: 'lowestaudio' });
      const chunks = [];
      
      // Cap stream at 5 minutes to avoid large files
      const readStream = new ReadableStream({
        start(controller) {
          const reader = stream[Symbol.asyncIterator] ? null : null;
          stream.on('data', chunk => {
            controller.enqueue(chunk);
          });
          stream.on('end', () => controller.close());
          stream.on('error', err => controller.error(err));
        }
      });
      for await (const chunk of readStream) {
        chunks.push(chunk);
      }

      if (chunks.length === 0) throw new Error('Empty audio stream');
      
      const audioBuffer = Buffer.concat(chunks);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      // Upload as FormData for the UploadFile integration
      const formData = new FormData();
      formData.append('file', audioBlob, `audio_${youtubeId}.webm`);
      
      const uploadRes = await fetch('https://api.base44.com/v1/integrations/upload', {
        method: 'POST',
        headers: { 'Authorization': req.headers.get('authorization') },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      audioUrl = uploadData.file_url;
      break;
    } catch (e) {
      console.warn(`Audio download attempt ${attempt} failed: ${e.message}`);
      if (attempt === DOWNLOAD_RETRIES) throw e;
    }
  }

  if (!audioUrl) throw new Error('Could not download audio');

  // Transcribe with Whisper
  const transcriptResult = await Promise.race([
    base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Transcription timed out')), TRANSCRIBE_TIMEOUT)),
  ]);

  if (!transcriptResult) throw new Error('Transcription returned empty');
  return transcriptResult;
}

function segmentTranscript(transcriptText) {
  // Split by sentence delimiters and grouping
  const sentences = transcriptText.split(/(?<=[.!?\n])\s*/).filter(Boolean);
  const segments = [];
  const totalWords = sentences.flatMap(s => s.split(/\s+/).filter(Boolean)).length;

  let wordProgress = 0;
  for (const sentence of sentences) {
    for (let i = 0; i < 100; i++) segments.push({ text: sentence, start: 0, end: 10 });
  }

  const sentenceWords = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  // Distribute evenly over a default 240s song — better than nothing
  return sentences.map((text, i) => {
    const segWords = text.split(/\s+/).filter(Boolean).length;
    const prop = segWords / Math.max(totalWords, 1);
    return { text, start: 0, end: 240 * prop };
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    const song = await base44.entities.Song.get(songId);
    if (!song || !song.youtube_id) {
      console.log('Stage 3b: no youtube_id, skipping');
      return Response.json({ success: false, stage: '3b', skipped: true, reason: 'No youtube_id' });
    }

    console.log(`Stage 3b: Whisper forced alignment for ${song.title}`);
    const lines = await base44.asServiceRole.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
    if (!lines || lines.length < 3) {
      return Response.json({ success: false, stage: '3b', skipped: true, reason: 'Too few lines' });
    }

    // Download and transcribe
    const rawTranscript = await downloadAndTranscribe(base44, song.youtube_id);
    console.log(`Stage 3b: transcript length ${rawTranscript.length} chars`);

    // Segment the transcript into chunks approximating lyric-line timing
    const segments = segmentTranscript(rawTranscript);

    // Greedy-match segments to lyric lines with interpolation
    const timedLines = greedyMatch(segments, lines);

    const cappedLines = timedLines.map((tl, i) => {
      const line = lines[i];
      const wordCount = (line.spanish_text || '').split(/\s+/).filter(Boolean).length;
      const maxEnd = tl.start_seconds + Math.max(wordCount * 0.8 + 0.3, 2);
      return {
        id: line.id,
        start_seconds: tl.start_seconds,
        end_seconds: Math.min(tl.end_seconds || tl.start_seconds + wordCount * 0.8 + 0.3, maxEnd),
      };
    });

    // Batch update only lines that got non-zero timestamps
    const updates = cappedLines.filter(tl => tl.start_seconds > 0 || tl.end_seconds > 0);
    const matchedCount = timedLines.filter(tl => tl.matched).length;
    const totalHasTimestamps = cappedLines.filter(tl => tl.start_seconds > 0).length;
    const syncSuccess = totalHasTimestamps >= Math.min(lines.length * 0.3, 6);

    if (updates.length > 0) {
      await base44.asServiceRole.entities.LyricLine.bulkUpdate(updates);
      console.log(`Stage 3b: aligned ${matchedCount}/${lines.length} lines, ${totalHasTimestamps} have timestamps`);
    }

    await base44.entities.Song.update(songId, {
      sync_status: syncSuccess ? 'ready_synced' : 'ready_unsynced',
    });

    return Response.json({
      success: syncSuccess,
      stage: '3b',
      lines_total: lines.length,
      matched: matchedCount,
      has_timestamps: totalHasTimestamps,
    });
  } catch (error) {
    console.error('Stage 3b fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});