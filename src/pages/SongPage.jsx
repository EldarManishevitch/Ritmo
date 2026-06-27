import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, SlidersHorizontal, X, Music, BookOpen, Trophy, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import SyncedLyrics from '@/components/song/SyncedLyrics';
import WordLookup from '@/components/song/WordLookup';
import ChorusQuiz from '@/components/song/ChorusQuiz';
import GenerationProgressPill from '@/components/song/GenerationProgressPill';
import { generateLyrics } from '@/lib/lyricsPipeline';
import { songCefr } from '@/lib/cefr';

const STATUS_LABELS = {
  pending: 'Preparing…',
  fetching_lyrics: 'Fetching lyrics…',
  translating: 'Translating lines…',
  ready: 'Ready',
  static: 'Ready (unsynced)',
  failed: 'Failed to load',
};

const SECTIONS = [
  { id: 'full', label: 'Full Song' },
  { id: 'verse1', label: 'Verse 1' },
  { id: 'verse2', label: 'Verse 2' },
  { id: 'chorus', label: 'The Chorus' },
];

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
  const [tab, setTab] = useState('lyrics');
  const [vocab, setVocab] = useState([]);
  const [flags, setFlags] = useState([]);
  const [section, setSection] = useState('full');
  const [showEnglish, setShowEnglish] = useState(true);
  const playerContainerId = 'yt-player';

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
        if (s.sync_status === 'pending') {
          generateLyrics({ songId: id }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSong(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!song) return;
    const inProgress = ['pending', 'fetching_lyrics', 'translating'].includes(song.sync_status);

    // Always load current lines (supports progressive live-rendering)
    base44.entities.LyricLine.filter({ song_id: id }, 'line_index', 500)
      .then(setLines)
      .catch(() => {});

    if (!inProgress) return;

    // Poll song status until generation completes
    const interval = setInterval(async () => {
      const s = await loadSong();
      if (!['pending', 'fetching_lyrics', 'translating'].includes(s.sync_status)) {
        clearInterval(interval);
      }
    }, 1500);

    // Realtime: live-render lyric lines as they are created/updated
    const unsubscribe = base44.entities.LyricLine.subscribe((event) => {
      const data = event.data;
      if (!data || data.song_id !== id) return;
      setLines((prev) => {
        if (event.type === 'delete') return prev.filter((l) => l.id !== data.id);
        const idx = prev.findIndex((l) => l.id === data.id);
        if (idx === -1) {
          return [...prev, data].sort((a, b) => a.line_index - b.line_index);
        }
        const next = [...prev];
        next[idx] = data;
        return next;
      });
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [song?.sync_status, id]);

  const { ready, currentTime, seekTo, pause } = useYouTubePlayer(
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

  const loadVocab = async () => {
    try {
      const v = await base44.entities.SavedWord.filter({ source_song_id: id }, '-created_date', 200);
      setVocab(v || []);
      const f = await base44.entities.PracticeFlag.filter({ song_id: id });
      setFlags(f || []);
    } catch { /* noop */ }
  };

  useEffect(() => {
    if (tab === 'vocab') loadVocab();
  }, [tab, id]);

  const speakWord = (w) => {
    const u = new SpeechSynthesisUtterance(w);
    u.lang = 'es-ES';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  const filteredLines = useMemo(() => {
    if (section === 'full') return lines;
    if (section === 'chorus') return lines.filter((l) => l.is_chorus);
    const nonChorus = lines.filter((l) => !l.is_chorus);
    if (section === 'verse1') return nonChorus.slice(0, Math.ceil(nonChorus.length / 2));
    if (section === 'verse2') return nonChorus.slice(Math.ceil(nonChorus.length / 2));
    return lines;
  }, [lines, section]);

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
  const thumbnail = song.album_art_url || `https://i.ytimg.com/vi/${song.youtube_id}/mqdefault.jpg`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="safe-area-top flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
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

      {/* Song header */}
      <div className="px-4 py-4 flex items-center gap-4 border-b border-border">
        <img src={thumbnail} alt={song.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {song.genre && (
              <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#2A4B62' }}>
                {song.genre}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-primary truncate">{song.title}</h1>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
      </div>

      {/* Tab pills */}
      <div className="px-4 py-3 flex gap-2 border-b border-border">
        {[
          { id: 'lyrics', label: 'Lyrics', icon: Music },
          { id: 'vocab', label: 'Vocab', icon: BookOpen, badge: vocab.length + flags.length },
          { id: 'quiz', label: 'Quiz', icon: Trophy },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge > 0 && (
                <span className="ml-0.5 text-xs bg-white/30 rounded-full px-1.5 min-w-[18px] text-center">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      {song.sync_status === 'failed' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-destructive">{STATUS_LABELS.failed}</p>
          <Button size="sm" variant="outline" onClick={() => {
            setSong({ ...song, sync_status: 'fetching_lyrics' });
            generateLyrics({ songId: id }).catch(() => {}).finally(() => loadSong());
          }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          <GenerationProgressPill status={song.sync_status} visible={inProgress} />
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left column: video + quiz button */}
          <div className="lg:w-3/5 flex flex-col">
            <div className="relative bg-black">
              <div id={playerContainerId} className="w-full aspect-video" />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                </div>
              )}
            </div>
            <div className="px-4 py-3 flex items-center gap-3 border-b lg:border-b-0 lg:border-r border-border">
              <Button size="sm" variant="outline" onClick={() => setTab('quiz')} className="flex-shrink-0">
                <Trophy className="h-4 w-4 mr-1" /> Practice with a Quiz
              </Button>
              <p className="text-xs text-muted-foreground">
                Listen, tap any unfamiliar word, then ace the quiz to mark this song complete.
              </p>
            </div>
          </div>

          {/* Right column: lyrics/vocab/quiz */}
          <div className="lg:w-2/5 flex-1 flex flex-col min-h-0">
            {tab === 'lyrics' && (
              <>
                {/* Section filter pills */}
                <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSection(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        section === s.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                      }`}
                    >
                      <Music className="h-3 w-3" />
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Lyrics header with English toggle */}
                <div className="px-4 py-2 flex items-center justify-between border-b border-border">
                  <span className="text-sm font-semibold text-foreground">
                    {SECTIONS.find((s) => s.id === section)?.label}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-muted-foreground">English</span>
                    <button
                      onClick={() => setShowEnglish(!showEnglish)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${showEnglish ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showEnglish ? 'translate-x-4' : ''}`} />
                    </button>
                  </label>
                </div>

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

                <SyncedLyrics
                  lines={filteredLines}
                  currentTime={currentTime}
                  offset={song.sync_offset_seconds || 0}
                  mode={mode}
                  showEnglish={showEnglish}
                  onWordTap={handleWordTap}
                  onLineSeek={(t) => seekTo(t)}
                  onPausePlayer={pause}
                />
              </>
            )}

            {tab === 'vocab' && (
              <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
                {vocab.length === 0 && flags.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Click words in the lyrics to save them here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vocab.map((v) => (
                      <div key={v.id} className="rounded-xl bg-card border border-border p-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-foreground">{v.word}</h3>
                          <p className="text-sm text-muted-foreground">{v.english_meaning}</p>
                          {v.pronunciation_hint && <p className="text-xs text-primary mt-0.5">🔊 {v.pronunciation_hint}</p>}
                          {v.is_slang && <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1">slang</span>}
                        </div>
                        <button onClick={() => speakWord(v.word)} className="p-2 rounded-lg hover:bg-muted text-primary flex-shrink-0">
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {flags.filter((f) => !vocab.find((v) => v.word === f.word)).map((f) => (
                      <div key={f.id} className="rounded-xl bg-destructive/5 border border-destructive/20 p-3">
                        <h3 className="font-bold text-foreground">{f.word}</h3>
                        <p className="text-xs text-destructive">needs practice · Missed {f.miss_count}× in quiz</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'quiz' && (
              <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
                <ChorusQuiz songId={id} lines={lines} songTitle={song.title} songArtist={song.artist} />
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}