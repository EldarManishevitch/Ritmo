import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { youtubeSearch, detectGenre } from '@/lib/aiHelpers';
import { generateLyrics } from '@/lib/lyricsPipeline';
import { useLanguage } from '@/lib/LanguageContext';

/**
 * Two-step song-add flow, now language-aware:
 *   1. search()  -> fetches up to 5 YouTube results optimized for the active language
 *   2. selectVideo(video) -> creates the Song with its language, fires the lyrics pipeline
 *      in the background, and optimistically navigates to /song/:id.
 */
export function useSongAdd() {
  const navigate = useNavigate();
  const { lang: activeLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const videos = await youtubeSearch({ query: query.trim(), language: activeLanguage });
      if (!Array.isArray(videos) || !videos.length) throw new Error('No videos found');
      setResults(videos);
    } catch (e) {
      setError(e.message || 'Search failed');
    }
    setSearching(false);
  };

  const selectVideo = async (video) => {
    if (adding || !video?.youtube_id) return;
    setAdding(true);
    setError('');
    try {
      // Create the song immediately so we can navigate without waiting for the pipeline.
      const song = await base44.entities.Song.create({
        title: video.title,
        artist: video.artist || 'Unknown',
        youtube_id: video.youtube_id,
        sync_status: 'fetching_lyrics',
      });
      // Detect the real genre in the background (don't block navigation).
      detectGenre({ title: video.title, artist: video.artist })
        .then((genre) => base44.entities.Song.update(song.id, { genre }))
        .catch(() => {});
      // Fire the heavy lyrics pipeline in the background with the active language;
      // SongPage polls and shows progress.
      generateLyrics({ songId: song.id, sourceLanguage: activeLanguage }).catch(() => {});
      setQuery('');
      setResults([]);
      navigate(`/song/${song.id}`);
      return song;
    } catch (e) {
      setError(e.message || 'Failed to add song');
      setAdding(false);
      throw e;
    }
  };

  const reset = () => {
    setQuery('');
    setResults([]);
    setError('');
  };

  return { query, setQuery, searching, results, adding, error, search, selectVideo, reset };
}