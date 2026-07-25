import { useEffect, useRef, useState } from 'react';
import { Hand, MessageCircle, Sparkles } from 'lucide-react';
import { getProgress } from '@/lib/progress';
import { slangDictionaryRepo } from '@/data/repositories/slangDictionary.repo';
import { Link } from 'react-router-dom';

const LS_DONE = 'sb_first_song_tutorial_done';
const LS_GRAMMAR_OPENED = 'sb_grammar_note_opened';
const LS_GRAMMAR_PASSPORT = 'sb_passport_grammar_opened';

const COACH = {
  'tap-word': "Tap any word you don't know.",
  'save-word': "Save it — we'll quiz you later.",
  grammar: "This line uses a tense you'll hear constantly. Tap to see why.",
};

/**
 * In-song first-lesson tutorial. Action-gated steps that coach the user through
 * tapping a word, saving it, opening a grammar note, then auto-starting the quiz
 * at song end and prompting a Roleplay after they pass. Runs only on the user's
 * first-ever song (guarded by localStorage + UserProgress.songs_completed === 0).
 */
export function useFirstSongTutorial({ songId, lines, playbackStarted, currentTime, duration, selectedWord, setTab }) {
  const [active, setActive] = useState(false);
  const [songsCompleted, setSongsCompleted] = useState(0);
  const [step, setStep] = useState('idle'); // idle → tap-word → save-word → grammar → song-end → quiz → roleplay → complete
  const [targetWord, setTargetWord] = useState(null);
  const [savedWord, setSavedWord] = useState(null);
  const [roleplayPrompt, setRoleplayPrompt] = useState(false);
  const slangFetchedRef = useRef(false);
  const doneRef = useRef(false);

  const markDone = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    localStorage.setItem(LS_DONE, '1');
  };

  // Gate: only the user's first-ever song
  useEffect(() => {
    if (localStorage.getItem(LS_DONE)) return;
    let cancelled = false;
    getProgress()
      .then((p) => {
        if (cancelled) return;
        setSongsCompleted(p?.songs_completed || 0);
        if (!p || (p.songs_completed || 0) === 0) setActive(true);
      })
      .catch(() => setActive(true));
    return () => { cancelled = true; };
  }, []);

  // Pick a word to pulse in the first lyric line — prefer one with a SlangDictionary entry
  useEffect(() => {
    if (!active || slangFetchedRef.current || !lines.length || !playbackStarted) return;
    slangFetchedRef.current = true;
    (async () => {
      let slangWords = new Set();
      try {
        const terms = await slangDictionaryRepo.bySong(songId);
        (terms || []).forEach((t) => { if (t.term) slangWords.add(t.term.toLowerCase().trim()); });
      } catch { /* noop */ }
      const firstLine = lines.find((l) => l.spanish_text && l.spanish_text.trim().length >= 2);
      if (!firstLine) return;
      const tokens = firstLine.spanish_text.split(/\s+/);
      const clean = (w) => w.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
      let pick = tokens.find((w) => { const c = clean(w); return c.length > 2 && slangWords.has(c); });
      if (!pick) pick = tokens.find((w) => clean(w).length > 3) || tokens[0] || '';
      setTargetWord(clean(pick));
    })();
  }, [active, lines, playbackStarted, songId]);

  // idle → tap-word: once playback has started the first lyric line
  useEffect(() => {
    if (!active || step !== 'idle') return;
    if (!playbackStarted || !lines.length) return;
    if (currentTime > 1.5) setStep('tap-word');
  }, [active, step, playbackStarted, lines, currentTime]);

  // tap-word → save-word: when the user taps a word (WordLookup opens)
  useEffect(() => {
    if (active && step === 'tap-word' && selectedWord) setStep('save-word');
  }, [active, step, selectedWord]);

  const handleSave = (word) => {
    if (active && step === 'save-word') {
      setSavedWord(word);
      setStep('grammar');
    }
  };

  const handleGrammarOpen = () => {
    if (active && step === 'grammar') setStep('song-end');
  };

  const handleGrammarDismiss = () => {
    if (active && step === 'grammar') setStep('song-end');
  };

  // Once core coaching (tap/save/grammar) is done, never re-show on future songs
  useEffect(() => {
    if (active && step === 'song-end') markDone();
  }, [active, step]);

  // song-end → quiz: auto-start the quiz when the song finishes
  useEffect(() => {
    if (!active || step !== 'song-end') return;
    if (duration > 0 && currentTime >= duration - 0.5) {
      setStep('quiz');
      setTab('quiz');
    }
  }, [active, step, duration, currentTime, setTab]);

  // quiz → roleplay: after they pass the quiz
  const handleQuizComplete = () => {
    if (active && step === 'quiz') {
      setStep('roleplay');
      setRoleplayPrompt(true);
    }
  };

  const handleRoleplayCta = () => {
    setRoleplayPrompt(false);
    setStep('complete');
  };

  // Badge on grammar icons until the user opens one note within their first 3 songs
  const grammarBadge = songsCompleted < 3 && !localStorage.getItem(LS_GRAMMAR_OPENED);

  return {
    active,
    step,
    targetWord: step === 'tap-word' ? targetWord : null,
    pulseSave: active && step === 'save-word',
    grammarPulseStep: active && step === 'grammar',
    grammarBadge,
    ensureWord: active && (step === 'quiz' || step === 'song-end') ? savedWord : null,
    roleplayPrompt,
    handleSave,
    handleGrammarOpen,
    handleGrammarDismiss,
    handleQuizComplete,
    handleRoleplayCta,
  };
}

export function FirstSongCoach({ step, onDismiss }) {
  const text = COACH[step];
  if (!text) return null;
  const dismissible = step === 'grammar';
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md px-2">
      <div className="rounded-2xl bg-foreground text-background shadow-xl px-4 py-3 flex items-center gap-3">
        <Hand className="h-5 w-5 flex-shrink-0 animate-bounce" />
        <p className="text-sm font-medium flex-1">{text}</p>
        {dismissible && (
          <button onClick={onDismiss} className="text-xs underline opacity-80 hover:opacity-100 flex-shrink-0">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

export function FirstSongRoleplayPrompt({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">You just learned some words.</h3>
        <p className="text-sm text-muted-foreground mb-5">Want to use them in a conversation?</p>
        <div className="flex flex-col gap-2">
          <Link
            to="/roleplay"
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium"
          >
            <Sparkles className="h-4 w-4 mr-1.5" /> Try a Roleplay
          </Link>
          <button onClick={onClose} className="w-full h-10 rounded-lg text-muted-foreground hover:text-foreground text-sm">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}