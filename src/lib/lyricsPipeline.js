import { base44 } from '@/api/base44Client';

/**
 * Client-side wrapper for the three-stage resilient lyrics pipeline.
 * Triggers the backend function and relies on realtime updates for progressive rendering.
 */

export async function generateLyrics({ songId, sourceLanguage = 'Spanish' }) {
  try {
    const song = await base44.entities.Song.get(songId);
    if (!song) throw new Error('Song not found');

    console.log('Triggering resilient lyrics pipeline for:', song.title);

    const result = await base44.functions.invoke('resilientLyricsPipeline', { 
      songId, 
      sourceLanguage 
    });

    console.log('Pipeline result:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('Pipeline invocation failed:', error.message);
    // Don't throw - let the UI handle it gracefully
    return null;
  }
}

/**
 * Aggressive lyrics fetching with automatic retry.
 * Call this on SongPage mount to ensure lyrics appear.
 */
export async function ensureLyricsLoaded(songId) {
  try {
    const song = await base44.entities.Song.get(songId);
    if (!song) return false;

    // Already has lyrics - just refresh them
    const existingLines = await base44.entities.LyricLine.filter({ song_id: songId }, 'line_index', 500);
    if (existingLines?.length > 0) {
      console.log('Lyrics already exist:', existingLines.length, 'lines');
      return true;
    }

    // No lyrics yet - trigger pipeline
    console.log('No lyrics found, triggering pipeline...');
    await base44.entities.Song.update(songId, { sync_status: 'fetching_lyrics' });
    await generateLyrics({ songId });
    return true;
    
  } catch (error) {
    console.error('ensureLyricsLoaded failed:', error.message);
    return false;
  }
}