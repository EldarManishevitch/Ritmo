import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSavedWordsForSong } from '@/data/hooks/useSavedWords';
import { usePracticeFlagsForSong } from '@/data/hooks/usePracticeFlags';
import { songCompletionsRepo } from '@/data/repositories/songCompletions.repo';
import QuizStep from './QuizStep';
import VocabMatchStep from './VocabMatchStep';
import SpeakChorusStep from './SpeakChorusStep';
import CompletionScreen from './CompletionScreen';
import { awardExerciseCompletion } from '@/lib/exerciseHelpers';
import { issueCertificateIfMastered } from '@/lib/certificates';
import { upsertGenreStatsOnCompletion } from '@/lib/genres';

const STEP_LABELS = ['Quiz', 'Vocab Match', 'Speak'];

export default function ExerciseFlow({ open, onClose, song, lines }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ quiz: 0, quizTotal: 10, vocab: 0, vocabTotal: 6, chorus: 0, chorusTotal: 3 });
  const [progress, setProgress] = useState(null);
  const [certResult, setCertResult] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [dbWriteDone, setDbWriteDone] = useState(false);

  const { data: savedWords = [] } = useSavedWordsForSong(song?.id, { enabled: open && !!song?.id });
  const { data: flags = [] } = usePracticeFlagsForSong(song?.id, { enabled: open && !!song?.id });

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setScores({ quiz: 0, quizTotal: 10, vocab: 0, vocabTotal: 6, chorus: 0, chorusTotal: 3 });
    setDbWriteDone(false);
    setCertResult(null);
    setProgress(null);
  }, [open, song?.id]);

  // DB writes happen once when step reaches 3 (completion)
  useEffect(() => {
    if (step !== 3 || dbWriteDone || !song) return;
    setDbWriteDone(true);
    (async () => {
      // Create SongCompletion record first so "next song" excludes it
      const xpAwarded = scores.quiz * 10 + 15;
      await songCompletionsRepo.create({
        song_id: song.id,
        song_title: song.title,
        quiz_score: scores.quiz,
        vocab_score: scores.vocab,
        chorus_score: scores.chorus,
        completed_at: new Date().toISOString(),
        xp_awarded: xpAwarded,
      }).catch(() => {});
      upsertGenreStatsOnCompletion({ songId: song.id, xpAwarded }).catch(() => {});
      const result = await awardExerciseCompletion(scores.quiz);
      setProgress(result);
      const cert = await issueCertificateIfMastered({ song, score: scores.quiz, total: scores.quizTotal });
      setCertResult(cert);
    })();
  }, [step, dbWriteDone, song, scores]);

  const handleQuizComplete = useCallback((score, total) => {
    setScores((s) => ({ ...s, quiz: score, quizTotal: total }));
    setStep(1);
  }, []);

  const handleVocabComplete = useCallback((score, total) => {
    setScores((s) => ({ ...s, vocab: score, vocabTotal: total }));
    setStep(2);
  }, []);

  const handleSpeakComplete = useCallback((score, total) => {
    setScores((s) => ({ ...s, chorus: score, chorusTotal: total }));
    setStep(3);
  }, []);

  if (!open) return null;

  const progressPct = step < 3 ? ((step + 1) / 3) * 100 : 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Progress header */}
      <div className="safe-area-top px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-colors ${
                  i <= step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>{i + 1}</span>
                <span className={`text-xs font-medium hidden sm:inline ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                {i < 2 && <span className="text-muted-foreground mx-0.5 hidden sm:inline">·</span>}
              </div>
            ))}
          </div>
          <button onClick={() => setShowExitConfirm(true)} className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Steps with horizontal slide transition */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${step * 100}%)` }}>
          <div className="w-full h-full flex-shrink-0 overflow-y-auto">
            <QuizStep lines={lines} savedWords={savedWords} onComplete={handleQuizComplete} />
          </div>
          <div className="w-full h-full flex-shrink-0 overflow-y-auto">
            <VocabMatchStep song={song} savedWords={savedWords} lines={lines} onComplete={handleVocabComplete} />
          </div>
          <div className="w-full h-full flex-shrink-0 overflow-y-auto">
            <SpeakChorusStep lines={lines} flags={flags} onComplete={handleSpeakComplete} />
          </div>
          <div className="w-full h-full flex-shrink-0 overflow-y-auto">
            <CompletionScreen scores={scores} song={song} progress={progress} certResult={certResult} onClose={onClose} />
          </div>
        </div>
      </div>

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowExitConfirm(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Exit exercise?</h3>
            <p className="text-sm text-muted-foreground mb-5">Your progress won't be saved.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-medium">
                Keep going
              </button>
              <button onClick={() => { setShowExitConfirm(false); onClose(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-foreground">
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}