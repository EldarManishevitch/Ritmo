import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { youtubeSearch } from '@/lib/aiHelpers';
import { generateLyrics } from '@/lib/lyricsPipeline';

export default function AddSongDialog({ open, onClose, onAdded }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setError('');
    setResult(null);
    try {
      const r = await youtubeSearch({ query: query.trim() });
      if (!r?.youtube_id) throw new Error('No video found');
      setResult(r);
    } catch (e) {
      setError(e.message || 'Search failed');
    }
    setSearching(false);
  };

  const handleAdd = async () => {
    if (!result || generating) return;
    setGenerating(true);
    setError('');
    try {
      // Create the song immediately so we can navigate without waiting
      // for the full lyrics pipeline (which runs in the background).
      const song = await base44.entities.Song.create({
        title: result.title,
        artist: result.artist || 'Unknown',
        youtube_id: result.youtube_id,
        sync_status: 'fetching_lyrics',
      });
      // Fire the pipeline in the background; SongPage polls and shows progress.
      generateLyrics({ songId: song.id }).catch(() => {});
      onAdded?.();
      setQuery('');
      setResult(null);
      onClose?.();
      navigate(`/song/${song.id}`);
    } catch (e) {
      setError(e.message || 'Failed to add song');
    }
    setGenerating(false);
  };

  const handleClose = () => {
    if (searching || generating) return;
    setQuery('');
    setResult(null);
    setError('');
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new song</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Bad Bunny Tití Me Preguntó"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={searching || generating}
            />
            <Button onClick={handleSearch} disabled={searching || generating || !query.trim()} size="icon">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && (
            <div className="rounded-xl border border-border p-3 flex items-center gap-3 bg-muted/30">
              {result.thumbnail_url && (
                <img src={result.thumbnail_url} alt={result.title} className="w-16 h-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{result.title}</p>
                <p className="text-xs text-muted-foreground truncate">{result.artist}</p>
                <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">ID: {result.youtube_id}</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={searching || generating}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!result || generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {generating ? 'Fetching lyrics…' : 'Add & fetch lyrics'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}