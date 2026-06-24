import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { youtubeSearch } from '@/lib/aiHelpers';
import { generateLyrics } from '@/lib/lyricsPipeline';

export default function AddSongSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const r = await youtubeSearch({ query: query.trim() });
      if (!r?.youtube_id) throw new Error('No video found');
      const song = await base44.entities.Song.create({
        title: r.title,
        artist: r.artist || 'Unknown',
        youtube_id: r.youtube_id,
        sync_status: 'fetching_lyrics',
      });
      generateLyrics({ songId: song.id }).catch(() => {});
      setQuery('');
      navigate(`/song/${song.id}`);
    } catch (e) {
      setError(e.message || 'Search failed');
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-foreground">Add a New Song</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Search YouTube for a Spanish track. We'll auto-generate lyrics, translations, and chorus markings.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="e.g. Shakira Hips Don't Lie"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          disabled={loading}
          className="flex-1"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="h-9 w-9 rounded-md flex items-center justify-center bg-[#e8b79e] hover:bg-[#e0a88c] disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Search className="h-4 w-4 text-white" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}