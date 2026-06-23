import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import SyncedLyrics from '@/components/song/SyncedLyrics';
import WordLookup from '@/components/song/WordLookup';
import { generateLyrics } from '@/lib/lyricsPipeline';

const STATUS_LABELS = {
  pending: 'Preparing…',
  fetching_lyrics: 'Fetching lyrics…',
  translating: 'Translating lines…',
  ready: 'Ready',
  static: 'Ready (unsynced)',
  failed: 'Failed to load',
};

export default function SongPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [lines, setLines] = useState([]);
  const [loadingSong, setLoadingSong] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedContext, setSelectedContext] = useState('');
  const [showOffset, setShowOffset] = useState(false);
  const [offsetInput, setOffsetInput] = useState('0');
  const playerContainerId = 'yt-player';

  // Load song
  const loadSong = async () => {
    const s = await base44.entities.Song.get(id);
    setSong(s);
    setOffsetInput(String(s.sync_offset_seconds || 0));
    return s;
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingSong(true);
    loadSong()
      .then(async (s) => {
        if (cancelled) return;
        // Auto-trigger pipeline if pending
        if (s.sync_status === 'pending') {
          generateLyrics({ songId: id }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSong(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Poll song status + load lines when ready
  useEffect(() => {
    if (!song) return;
    const inProgress = ['pending', 'fetching_lyrics', 'translating'].includes(song.sync_status);
    if (!inProgress) {
      // Load lines
      base44.entities.LyricLine.filter({ song_id: id }, 'line_index', 500)
        .then(setLines)
        .catch(() => {});
      return;
    }
    const interval = setInterval(async () => {
      const s = await loadSong();
      if (!['pending', 'fetching_lyrics', 'translating'].includes(s.sync_status)) {
        clearInterval(interval);
        base44.entities.LyricLine.filter({ song_id: id }, 'line_index', 500)
          .then(setLines)
          .catch(() => {});
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [song?.sync_status, id]);

  const { ready, currentTime, seekTo } = useYouTubePlayer(
    song?.youtube_id || '',
    playerContainerId
  );

  const handleWordTap = (word, context) => {
    setSelectedWord(word);
    setSelectedContext(context);
  };

  const handleSaveOffset = async () => {
    const val = parseFloat(offsetInput) || 0;
    await base44.entities.Song.update(id, { sync_offset_seconds: val });
    setSong({ ...song, sync_offset_seconds: val });
    setShowOffset(false);
  };

  if (loadingSong) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Song not found</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to songs</Button>
      </div>
    );
  }

  const inProgress = ['pending', 'fetching_lyrics', 'translating'].includes(song.sync_status);
  const mode = song.sync_status === 'static' ? 'static' : 'synced';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center min-w-0 flex-1 px-2">
          <h1 className="font-semibold text-sm truncate">{song.title}</h1>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
        <button onClick={() => setShowOffset(!showOffset)} className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Offset control */}
      {showOffset && (
        <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sync offset (s)</span>
          <Input
            type="number"
            step="0.1"
            value={offsetInput}
            onChange={(e) => setOffsetInput(e.target.value)}
            className="h-8 w-24"
          />
          <Button size="sm" onClick={handleSaveOffset}>Apply</Button>
          <span className="text-xs text-muted-foreground">Negative = earlier</span>
        </div>
      )}

      {/* YouTube player */}
      <div className="relative bg-black">
        <div id={playerContainerId} className="w-full aspect-video" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white/60" />
          </div>
        )}
      </div>

      {/* Status / Lyrics */}
      {inProgress ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">{STATUS_LABELS[song.sync_status]}</p>
          <p className="text-xs text-muted-foreground">This usually takes a few seconds</p>
        </div>
      ) : song.sync_status === 'failed' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-destructive">{STATUS_LABELS.failed}</p>
          <Button size="sm" variant="outline" onClick={() => generateLyrics({ songId: id }).then(() => loadSong())}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Word lookup panel */}
          {selectedWord && (
            <div className="px-4 pt-3 relative">
              <button
                onClick={() => setSelectedWord(null)}
                className="absolute top-4 right-6 z-10 h-7 w-7 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
              <WordLookup word={selectedWord} context={selectedContext} songId={id} />
            </div>
          )}
          {/* Lyrics */}
          <div className="flex-1 min-h-0">
            <SyncedLyrics
              lines={lines}
              currentTime={currentTime}
              offset={song.sync_offset_seconds || 0}
              mode={mode}
              onWordTap={handleWordTap}
              onLineSeek={(t) => seekTo(t)}
            />
          </div>
        </div>
      )}
    </div>
  );
}