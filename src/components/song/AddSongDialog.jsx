import React from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSongAdd } from '@/hooks/useSongAdd';
import YouTubeResultsGrid from '@/components/song/YouTubeResultsGrid';

export default function AddSongDialog({ open, onClose, onAdded }) {
  const { query, setQuery, searching, results, adding, error, search, selectVideo, reset } = useSongAdd();

  const handleSelect = async (video) => {
    try {
      await selectVideo(video);
      onAdded?.();
      reset();
      onClose?.();
    } catch { /* error surfaced via hook state */ }
  };

  const handleClose = () => {
    if (searching || adding) return;
    reset();
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
              onKeyDown={(e) => e.key === 'Enter' && search()}
              disabled={searching || adding}
            />
            <Button onClick={search} disabled={searching || adding || !query.trim()} size="icon">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {results.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">Tap the correct video to fetch lyrics for it.</p>
              <YouTubeResultsGrid results={results} onSelect={handleSelect} disabled={adding} />
            </>
          )}

          {adding && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating song & fetching lyrics…
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={searching || adding}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}