import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Share2, ArrowRight, Flame, Award, BookOpen } from 'lucide-react';
import { useSavedWordsFilter } from '@/data/hooks/useSavedWords';
import { getNextRecommendedSong } from '@/lib/exerciseHelpers';

export default function CompletionScreen({ scores, song, progress, certResult, onClose }) {
  const navigate = useNavigate();
  const [shared, setShared] = useState(false);
  const [nextSong, setNextSong] = useState(null);
  const { data: masteredWords = [] } = useSavedWordsFilter({ mastered: true });
  const masteredCount = masteredWords.length;

  const xpGain = scores.quiz * 10 + 15;
  const streak = progress?.current_streak || 0;

  useEffect(() => {
    const cefr = progress?.newLevel?.cefr || progress?.cefr_level || 'A1';
    getNextRecommendedSong(cefr, song.id).then(setNextSong).catch(() => {});
  }, [progress, song.id]);

  const handleShare = () => {
    const text = `I just practiced '${song.title}' by ${song.artist} on Spanish Beats and scored ${scores.quiz}/${scores.quizTotal}! 🎵 #SpanishBeats`;
    navigator.clipboard.writeText(text).then(() => setShared(true)).catch(() => setShared(true));
  };

  const handleNextSong = () => {
    if (nextSong) navigate(`/song/${nextSong.id}`);
  };

  if (!progress) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-8 gap-4">
      {/* Checkmark animation */}
      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center animate-checkmark">
        <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">¡Lo lograste!</h1>
        <p className="text-sm text-muted-foreground mt-1">{song.title} · {song.artist}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Quiz</p>
          <p className="text-lg font-bold text-foreground">{scores.quiz}/{scores.quizTotal}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Vocab</p>
          <p className="text-lg font-bold text-foreground">{scores.vocab}/{scores.vocabTotal}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Chorus</p>
          <p className="text-lg font-bold text-foreground">{scores.chorus}/{scores.chorusTotal}</p>
        </div>
      </div>

      {/* XP awarded */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-primary">+{xpGain} XP</span>
      </div>

      {/* Streak + mastered words */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="font-bold text-foreground">{streak}</span>
          <span className="text-muted-foreground">day streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-bold text-foreground">{masteredCount}</span>
          <span className="text-muted-foreground">mastered</span>
        </div>
        {certResult && (
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-foreground">Cert</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col w-full max-w-md gap-2 mt-2">
        <button onClick={handleShare} className="h-11 rounded-lg border border-border text-sm font-medium text-foreground flex items-center justify-center gap-2">
          <Share2 className="h-4 w-4" />
          {shared ? 'Copied!' : 'Share your score'}
        </button>
        {nextSong && (
          <button onClick={handleNextSong} className="h-11 rounded-lg bg-primary text-white text-sm font-medium flex items-center justify-center gap-2">
            Next song →
            <span className="text-xs text-white/80">{nextSong.title}</span>
          </button>
        )}
        <button onClick={onClose} className="h-11 rounded-lg text-sm font-medium text-muted-foreground">
          Back to song
        </button>
      </div>
    </div>
  );
}