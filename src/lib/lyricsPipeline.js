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
    throw error;
  }
}