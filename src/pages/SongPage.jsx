import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, SlidersHorizontal, X, Music, BookOpen, Trophy, Volume2, GraduationCap, Play, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { songsRepo } from '@/data/repositories/songs.repo';
import { savedWordsRepo } from '@/data/repositories/savedWords.repo';
import { practiceFlagsRepo } from '@/data/repositories/practiceFlags.repo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import SyncedLyrics from '@/components/song/SyncedLyrics';
import WordLookup from '@/components/song/WordLookup';
import ChorusQuiz from '@/components/song/ChorusQuiz';
import GenerationProgressPill from '@/components/song/GenerationProgressPill';
import SongPageSkeleton from '@/components/song/SongPageSkeleton';
import WarmUpCard from '@/components/song/WarmUpCard';
import { useFirstSongTutorial, FirstSongCoach, FirstSongRoleplayPrompt } from '@/components/song/FirstSongTutorial';
import { incrementWeeklyWordTap } from '@/lib/weeklyXp';
import { generateLyrics, ensureLyricsLoaded } from '@/lib/lyricsPipeline';
import { recordSongView } from '@/lib/searchHistory';
import { getCachedSong } from '@/lib/songCache';
import { getCachedLines, setCachedLines } from '@/lib/lyricsCache';
import { prewarmWordTranslations } from '@/lib/aiHelpers';
import ExerciseFlow from '@/components/exercise/ExerciseFlow';
import SEOHead from '@/components/SEOHead';
import JsonLd from '@/components/JsonLd';

const STATUS_LABELS = {
  pending: 'Preparing song…',
  fetching_lyrics: 'Fetching lyrics…',
  translating: 'Translating lines…',
  ready: 'Lyrics ready',
  ready_synced: 'Lyrics ready (synced)',
  ready_unsynced: 'Lyrics ready (unsynced)',
  failed: 'Failed to load lyrics',
};

const STATUS_COLORS = {
  pending: 'bg-blue-100 text-blue-700 border-blue-200',
  fetching_lyrics: 'bg-orange-100 text-orange-700 border-orange-200',
  translating: 'bg-purple-100 text-purple-700 border-purple-200',
  ready: 'bg-green-100 text-green-700 border-green-200',
  ready_synced: 'bg-green-100 text-green-700 border-green-200',
  ready_unsynced: 'bg-green-100 text-green-700 border-green-200',
  static: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-border-200',
};

const STATUS_ICONS = {
  pending: '⏳',
  fetching_lyrics: '📝',
  translating: '🌐',
  ready: '✅',
  ready_synced: '✅',
  ready_unsynced: '✅',
  failed: '❌',
};

// Section tabs are computed dynamically from streamed lines (see `sections` memo).

export default function SongPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Instant render from the hover-prefetch cache (if available) — skips the loading spinner
  const cachedSongData = getCachedSong(id);
  const [song, setSong] = useState(cachedSongData?.song || null);
  const [lines, setLines] = useState(cachedSongData?.lines || []);
  const [pendingSong, setPendingSong] = useState(!cachedSongData?.song);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedContext, setSelectedContext] = useState('');
  const [showOffset, setShowOffset] = useState(false);
  const [offsetInput, setOffsetInput] = useState('0');
  const [tab, setTab] = useState('lyrics');
  const [vocab, setVocab] = useState([]);
  const [flags, setFlags] = useState([]);
  const [section, setSection] = useState('full');
  const [displayMode, setDisplayMode] = useState('both');
  const [autoSyncAttempted, setAutoSyncAttempted] = useState(false);
  const [showExerciseBanner, setShowExerciseBanner] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [tier1Progress, setTier1Progress] = useState(0);
  const [audioSlow, setAudioSlow] = useState(false);
  const [generationTimedOut, setGenerationTimedOut] = useState(false);
  const playerContainerId = retryCount > 0 ? `yt-player-r${retryCount}` : 'yt-player';

  const inProgress = song ? ['pending', 'fetching_lyrics', 'translating'].includes(song.sync_status) : false;
  const mode = song?.sync_status === 'static' || song?.sync_status === 'ready_unsynced' ? 'static' : 'synced';
  const isUnsynced = song && (song.sync_status === 'ready_unsynced' || song.sync_status === 'static');

  // Compute progressive UI states based on available data
  const hasOriginalLyrics = lines.length > 0 && lines.some((l) => l.spanish_text);
  const hasTranslations = lines.some((l) => l.english_translation);
  const hasSyncTimestamps = lines.some((l) => (l.start_seconds || 0) > 0);
  const translationDisabled = !hasTranslations && inProgress;
  const syncDisabled = !hasSyncTimestamps;

  // Realtime subscriptions stay active for the lifetime of the page.
  // Song updates (status, offset, title, etc.) and lyric lines stream in
  // as the background pipeline writes them — the page never polls.
  useEffect(() => {
    // 1. Load the song row + existing lines immediately
    base44.entities.Song.get(id)
      .then((s) => {
        if (!s) return;
        setSong(s);
        setOffsetInput(String(s.sync_offset_seconds || 0));
        setPendingSong(false);
        setAutoSyncAttempted(false);
        recordSongView(s);

        // Auto-trigger the lyrics pipeline for catalog songs seeded as "pending"
        // or songs that previously failed. The pipeline runs end-to-end in one
        // execution; the realtime subscription streams progressive line updates.
        // Do NOT re-trigger if already "fetching_lyrics" or "translating" — it's running.
        if (s.sync_status === 'pending' || s.sync_status === 'failed') {
          console.log('Auto-triggering lyrics pipeline for', s.sync_status, 'song');
          generateLyrics({ songId: id }).catch(() => {});
        }
      })
      .catch(() => { setPendingSong(false); });

    // Instant reopen: paint cached lines immediately (may be stale), then
    // refresh from the network below and re-cache whatever comes back.
    getCachedLines(id).then((cached) => { if (cached) setLines(cached); });

    base44.entities.LyricLine.filter({ song_id: id }, 'line_index', 500)
      .then((loadedLines) => {
        setLines(loadedLines || []);
        setCachedLines(id, loadedLines);
      })
      .catch(() => {});

    // If no lines exist after load, trigger pipeline (covers edge cases)
    // checked 1.5s after load via the subscription fallback below
  }, [id]);

  // Auto-resync on mount: for unsynced songs, try once with a 1.2s grace window
  // so the status toggle has time to settle before re-syncing
  useEffect(() => {
    if (!pendingSong && isUnsynced && !autoSyncAttempted) {
      const timer = setTimeout(() => {
        setAutoSyncAttempted(true);
        console.log('Auto-resync on mount for unsynced song');
        generateLyrics({ songId: id }).catch(() => {});
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [id, pendingSong, isUnsynced, autoSyncAttempted]);

  // Pre-warm the word-translation cache once enough lines have streamed in (fire-and-forget)
  const prewarmedRef = useRef(false);
  useEffect(() => {
    if (prewarmedRef.current || lines.length < 8) return;
    prewarmedRef.current = true;
    const freq = {};
    lines.forEach((l) => {
      (l.spanish_text || '').split(/\s+/).forEach((w) => {
        const clean = w.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
        if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
      });
    });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
    if (top.length) prewarmWordTranslations(top).catch(() => {});
  }, [lines]);

  // Realtime: single subscription handles all live updates
  // (both Song row and LyricLine changes, eliminating the old polling loop)
  useEffect(() => {
    // Rerun if song was loaded but no lines arrived yet — triggers pipeline once
    if (!pendingSong && song && lines.length === 0 && !['pending', 'fetching_lyrics', 'translating'].includes(song.sync_status)) {
      console.log('No lines despite ready status, re-triggering');
      generateLyrics({ songId: id }).catch(() => {});
    }

    const unsubscribeLine = base44.entities.LyricLine.subscribe((event) => {
      const data = event.data;
      if (!data || data.song_id !== id) return;

      if (event.type === 'delete') {
        setLines((prev) => prev.filter((l) => l.id !== data.id));
        return;
      }

      // Streaming: new/updated lines arrive as the pipeline writes them
      setLines((prev) => {
        // Deduplicate by id (most stable)
        if (prev.some((l) => l.id === data.id)) {
          return prev.map((l) => (l.id === data.id ? data : l));
        }
        return [...prev, data].sort((a, b) => a.line_index - b.line_index);
      });
    });

    const unsubscribeSong = base44.entities.Song.subscribe((event) => {
      if (event.data?.id !== id) return;
      setSong((prev) => ({ ...(prev || event.data), ...event.data }));
    });

    return () => {
      unsubscribeLine();
      unsubscribeSong();
    };
  }, [id, pendingSong]);

  const displayId = playerContainerId;

  const { ready, currentTime, duration, seekTo, pause, isPlaying, error, play } = useYouTubePlayer(
    song?.youtube_id || '',
    displayId
  );

  const tutorial = useFirstSongTutorial({
    songId: id,
    lines,
    playbackStarted,
    currentTime,
    duration,
    selectedWord,
    setTab,
  });

  const handleWordTap = (word, context) => {
    setSelectedWord(word);
    setSelectedContext(context);
    try { localStorage.setItem('sb_passport_tapped_word', '1'); } catch { /* noop */ }
    incrementWeeklyWordTap();
  };

  const handleSaveOffset = async () => {
    const val = parseFloat(offsetInput) || 0;
    await songsRepo.update(id, { sync_offset_seconds: val });
    setSong({ ...song, sync_offset_seconds: val });
    setShowOffset(false);
  };

  const loadVocab = async () => {
    try {
      const v = await savedWordsRepo.bySong(id, 200);
      setVocab(v || []);
      const f = await practiceFlagsRepo.bySong(id);
      setFlags(f || []);
    } catch { /* noop */ }
  };

  useEffect(() => {
    if (tab === 'vocab') loadVocab();
  }, [tab, id]);

  // Show exercise banner when user has listened past 60% of the song
  useEffect(() => {
    if (!ready || !duration || showExerciseBanner || exerciseOpen) return;
    if (currentTime / duration >= 0.6) setShowExerciseBanner(true);
  }, [currentTime, duration, ready, showExerciseBanner, exerciseOpen]);

  // Tier 3 gate: track when playback first starts (unlocks quiz, grammar insights)
  useEffect(() => {
    if (isPlaying && !playbackStarted) setPlaybackStarted(true);
  }, [isPlaying, playbackStarted]);

  // Audio failure: auto-retry once on error, then show friendly message.
  // Only depends on [error, ready, audioFailed] — NOT retryCount — so the stale
  // error value left in the hook's state after a retry doesn't immediately re-fire.
  useEffect(() => {
    if (!error || ready || audioFailed) return;
    if (retryCount === 0) {
      const timer = setTimeout(() => setRetryCount(1), 1500);
      return () => clearTimeout(timer);
    }
    setAudioFailed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, ready, audioFailed]);

  // Audio timeout: if player never becomes ready, retry or fail
  useEffect(() => {
    if (ready || audioFailed) return;
    const timeout = retryCount === 0 ? 10000 : 6000;
    const timer = setTimeout(() => {
      if (retryCount === 0) setRetryCount(1);
      else setAudioFailed(true);
    }, timeout);
    return () => clearTimeout(timer);
  }, [ready, audioFailed, retryCount]);

  // Generation timeout: if the lyrics pipeline is still running after 45s,
  // surface a retry prompt instead of leaving the user staring at a spinner.
  useEffect(() => {
    if (!inProgress) {
      setGenerationTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setGenerationTimedOut(true), 45000);
    return () => clearTimeout(timer);
  }, [inProgress]);

  // Tier 1 determinate progress bar (0→90% while loading, 100% when ready)
  useEffect(() => {
    if (ready) { setTier1Progress(100); return; }
    if (audioFailed) return;
    setTier1Progress(0);
    const interval = setInterval(() => {
      setTier1Progress((p) => Math.min(p + 2.5, 90));
    }, 100);
    return () => clearInterval(interval);
  }, [ready, audioFailed, retryCount]);

  // Spec 2.4: if Tier 1 (audio) is slow, turn the stall into a lesson by surfacing
  // a "Preview the vocabulary" shortcut instead of just a spinner.
  useEffect(() => {
    if (ready || audioFailed) { setAudioSlow(false); return; }
    const timer = setTimeout(() => setAudioSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [ready, audioFailed, retryCount]);

  const handleAudioRetry = () => {
    setAudioFailed(false);
    setRetryCount((c) => c + 1);
  };

  const speakWord = (w) => {
    const u = new SpeechSynthesisUtterance(w);
    u.lang = 'es-ES';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  // Every non-instrumental line has an on-demand grammar note (GrammarInsight) —
  // surface the count near the play button so this depth isn't hidden (spec 3.4).
  const grammarLineCount = useMemo(
    () => lines.filter((l) => l.spanish_text && l.spanish_text.trim().length >= 2).length,
    [lines]
  );

  // Section tabs appear progressively as lines stream in (Full → Chorus → Verses)
  const sections = useMemo(() => {
    const secs = [{ id: 'full', label: 'Full Song' }];
    const hasChorus = lines.some((l) => l.is_chorus);
    const nonChorus = lines.filter((l) => !l.is_chorus);
    if (hasChorus) secs.push({ id: 'chorus', label: 'The Chorus' });
    if (nonChorus.length > 4) {
      secs.push({ id: 'verse1', label: 'Verse 1' });
      secs.push({ id: 'verse2', label: 'Verse 2' });
    }
    return secs;
  }, [lines]);

  const filteredLines = useMemo(() => {
    if (section === 'full') return lines;
    if (section === 'chorus') return lines.filter((l) => l.is_chorus);
    const nonChorus = lines.filter((l) => !l.is_chorus);
    if (section === 'verse1') return nonChorus.slice(0, Math.ceil(nonChorus.length / 2));
    if (section === 'verse2') return nonChorus.slice(Math.ceil(nonChorus.length / 2));
    return lines;
  }, [lines, section]);

  if (pendingSong) {
    return <SongPageSkeleton />;
  }

  if (!song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Song not found</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to songs</Button>
      </div>
    );
  }

  const thumbnail = song.album_art_url || `https://i.ytimg.com/vi/${song.youtube_id}/mqdefault.jpg`;
  const songUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  // The page is a language-learning lesson built around the song, not a place to stream/purchase
  // the recording — so LearningResource is the most accurate schema.org type, with the song
  // referenced via `about` as a MusicRecording.
  const learningResourceLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${song.title} — Spanish Lesson`,
    description: `Learn Spanish by singing '${song.title}' by ${song.artist}. Tap-to-translate lyrics, karaoke sync, pronunciation practice, and vocabulary quizzes. CEFR level ${song.cefr_level}.`,
    learningResourceType: 'Language lesson',
    inLanguage: 'es',
    teaches: { '@type': 'Language', name: 'Spanish' },
    educationalLevel: song.cefr_level,
    url: songUrl,
    about: {
      '@type': 'MusicRecording',
      name: song.title,
      byArtist: { '@type': 'MusicGroup', name: song.artist },
    },
  };

  return (
    <div className="h-[calc(100dvh-4rem)] bg-background flex flex-col overflow-hidden">
      <SEOHead
        title={`${song.title} by ${song.artist} — Spanish lyrics with English translation | Spanish Beats`}
        description={`Learn Spanish by singing '${song.title}' by ${song.artist}. Tap any word for an instant translation, sing along with karaoke lyrics, and quiz yourself on the vocabulary. CEFR level: ${song.cefr_level}.`}
        ogImage={song.album_art_url}
      />
      <JsonLd id="song-lesson" data={learningResourceLd} />
      {/* Top bar */}
      <div className="safe-area-top flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => generateLyrics({ songId: id }).catch(() => {})} 
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh lyrics"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button onClick={() => setShowOffset(!showOffset)} className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
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
        <button
          onClick={() => setExerciseOpen(true)}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-primary text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Practice
        </button>
      </div>

      {/* Main content — always rendered even while lines stream in */}
      {song.sync_status === 'failed' ? (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-destructive">{STATUS_LABELS.failed}</p>
          <p className="text-xs text-muted-foreground max-w-[250px]">
            Our pipeline couldn't fetch lyrics automatically. Try again or add the song manually.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              generateLyrics({ songId: id }).catch(() => {});
            }}>
              <RefreshCw className="h-4 w-4 mr-1" /> Retry
            </Button>
          </div>
        </div>
      ) : generationTimedOut ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-foreground">This song is taking longer than expected.</p>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            The lyrics pipeline is still working. Try refreshing the page, or retry below.
          </p>
          <Button size="sm" onClick={() => {
            setGenerationTimedOut(false);
            generateLyrics({ songId: id }).catch(() => {});
          }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Lyrics status indicator */}
          {!inProgress && song.sync_status && (
            <div className={`px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium border-b ${STATUS_COLORS[song.sync_status]}`}>
              <span>{STATUS_ICONS[song.sync_status]}</span>
              <span>{STATUS_LABELS[song.sync_status]}</span>
            </div>
          )}
          <GenerationProgressPill
            status={song.sync_status}
            visible={inProgress}
            songReady={!!song}
            lineCount={lines.length}
            translatedCount={lines.filter((l) => l.english_translation).length}
            estimatedTotal={40}
          />
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left column: video + quiz button — stays in place */}
          <div className="lg:w-3/5 flex flex-col shrink-0">
            <div className="relative bg-black aspect-video">
              <div id={displayId} className="w-full h-full" />
              {!ready && !audioFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                  <img src={thumbnail} alt="" className="w-20 h-20 rounded-xl object-cover opacity-50 mb-4" />
                  <button disabled className="flex items-center justify-center h-14 w-14 rounded-full bg-white/10 animate-pulse">
                    <Play className="h-6 w-6 text-white/50 ml-0.5" />
                  </button>
                  <p className="text-xs text-white/40 mt-3">Loading audio…</p>
                  {audioSlow && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                      onClick={() => setTab('vocab')}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Preview the vocabulary
                    </Button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div className="h-full bg-primary transition-all duration-100 ease-out" style={{ width: `${tier1Progress}%` }} />
                  </div>
                </div>
              )}
              {ready && !isPlaying && !audioFailed && (
                <button onClick={() => play()} className="absolute inset-0 flex items-center justify-center group">
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="h-6 w-6 text-white ml-0.5" />
                  </div>
                </button>
              )}
              {audioFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-6 text-center">
                  <p className="text-sm text-white/80 mb-1">Trouble loading the audio</p>
                  <p className="text-xs text-white/50 mb-4">But the lyrics are ready — want to read through first?</p>
                  <Button size="sm" variant="outline" onClick={handleAudioRetry}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry audio
                  </Button>
                </div>
              )}
            </div>
            <div className="px-4 py-3 flex items-center gap-3 border-b lg:border-b-0 lg:border-r border-border">
              <Button size="sm" variant="outline" onClick={() => setTab('quiz')} className="flex-shrink-0">
                <Trophy className="h-4 w-4 mr-1" /> Practice with a Quiz
              </Button>
              {grammarLineCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTab('lyrics')}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-[#6C6BD4] hover:underline"
                  title="Every line has a grammar note — tap the lightbulb under any line to open it"
                >
                  <Lightbulb className="h-3.5 w-3.5" /> {grammarLineCount} grammar notes in this song
                </button>
              )}
              <p className="text-xs text-muted-foreground hidden sm:block">
                Listen, tap any unfamiliar word, then ace the quiz to mark this song complete.
              </p>
            </div>
          </div>

          {/* Right column: lyrics/vocab/quiz — independent scroll */}
          <div className="lg:w-2/5 flex-1 flex flex-col min-h-0 overflow-hidden">
            {tab === 'lyrics' && (
              <>
                {/* Section filter pills */}
                <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
                  {sections.map((s) => (
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

                {/* Lyrics header with language toggle */}
                <div className="px-4 py-2 flex items-center justify-between border-b border-border">
                  <span className="text-sm font-semibold text-foreground">
                    {sections.find((s) => s.id === section)?.label || 'Full Song'}
                  </span>
                  <div className="flex rounded-full bg-muted p-0.5">
                    {[
                      { id: 'spanish', label: 'ES' },
                      { id: 'both', label: 'ES/EN' },
                      { id: 'english', label: 'EN' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setDisplayMode(opt.id)}
                        disabled={translationDisabled && opt.id !== 'spanish'}
                        className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                          displayMode === opt.id
                            ? 'bg-primary text-white'
                            : 'text-muted-foreground hover:text-foreground'
                        } ${(translationDisabled && opt.id !== 'spanish') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
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
                    <WordLookup word={selectedWord} context={selectedContext} songId={id} pulseSave={tutorial.pulseSave} onSaved={tutorial.handleSave} />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
                  {lines.length === 0 && !ready && !audioFailed ? (
                    <WarmUpCard songId={id} artist={song?.artist} genre={song?.genre} />
                  ) : (
                    <SyncedLyrics
                      lines={filteredLines}
                      currentTime={currentTime}
                      duration={duration}
                      offset={song.sync_offset_seconds || 0}
                      mode={mode}
                      displayMode={displayMode}
                      loading={inProgress && lines.length === 0}
                      onWordTap={handleWordTap}
                      onLineSeek={(t) => seekTo(t)}
                      onPausePlayer={pause}
                      onResync={() => generateLyrics({ songId: id })}
                      playbackStarted={playbackStarted}
                      tutorialTargetWord={tutorial.targetWord}
                      tutorialActive={tutorial.active && tutorial.step === 'tap-word'}
                      grammarPulseStep={tutorial.grammarPulseStep}
                      grammarBadge={tutorial.grammarBadge}
                      onGrammarOpen={tutorial.handleGrammarOpen}
                    />
                  )}
                </div>
                {showExerciseBanner && !exerciseOpen && (
                  <div className="flex items-center justify-between gap-2 px-4 py-3 bg-card border-t border-border shadow-lg">
                    <p className="text-sm text-foreground">Ready to lock in what you learned? Start the exercise →</p>
                    <button onClick={() => setExerciseOpen(true)} className="flex-shrink-0 h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium whitespace-nowrap">
                      Start exercise
                    </button>
                  </div>
                )}
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
                        <div className="flex flex-col items-end gap-1">
                          <button onClick={() => speakWord(v.word)} className="p-2 rounded-lg hover:bg-muted text-primary flex-shrink-0">
                            <Volume2 className="h-4 w-4" />
                          </button>
                        </div>
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
                {playbackStarted ? (
                  <ChorusQuiz songId={id} lines={lines} songTitle={song.title} songArtist={song.artist} songDifficulty={song.difficulty} ensureWord={tutorial.ensureWord} onComplete={tutorial.handleQuizComplete} />
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Start playing to unlock the quiz.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </>
      )}
      <ExerciseFlow
        open={exerciseOpen}
        onClose={() => setExerciseOpen(false)}
        song={song}
        lines={lines}
      />
      <FirstSongCoach step={tutorial.step} onDismiss={tutorial.handleGrammarDismiss} />
      {tutorial.roleplayPrompt && <FirstSongRoleplayPrompt onClose={tutorial.handleRoleplayCta} />}
    </div>
  );
}