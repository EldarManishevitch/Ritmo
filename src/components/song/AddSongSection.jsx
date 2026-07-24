import React from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSongAdd } from '@/hooks/useSongAdd';
import YouTubeResultsGrid from '@/components/song/YouTubeResultsGrid';

export default function AddSongSection() {
  const { query, setQuery, searching, results, adding, error, search, selectVideo } = useSongAdd();

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-foreground">Add a New Song</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Search YouTube for a Spanish track, pick the right video, and we'll auto-generate lyrics, translations, and chorus markings.
      </p>
      <div className="flex items-center gap-3">
        <Input
          placeholder="e.g. Shakira Hips Don't Lie"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          disabled={searching || adding}
          className="flex-1 min-w-0"
        />
        <button
          onClick={search}
          disabled={searching || adding || !query.trim()}
          className="h-9 w-9 rounded-md flex items-center justify-center bg-[#e8b79e] hover:bg-[#e0a88c] disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Search className="h-4 w-4 text-white" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      {results.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">Tap the correct video to fetch lyrics for it.</p>
          <YouTubeResultsGrid results={results} onSelect={selectVideo} disabled={adding} />
        </div>
      )}
      {adding && (
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
          <Loader2 className="h-4 w-4 animate-spin" /> Creating song & fetching lyrics…
        </p>
      )}
    </div>
  );
}