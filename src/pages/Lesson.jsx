import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { getOrCreateTodayLesson, completeTodayLesson, updateLessonStep } from '@/lib/dailyLesson';
import { getProgress } from '@/lib/progress';
import LessonHeader from '@/components/lesson/LessonHeader';
import ListenActivity from '@/components/lesson/ListenActivity';
import QuizActivity from '@/components/lesson/QuizActivity';
import FlashActivity from '@/components/lesson/FlashActivity';
import LessonCompletion from '@/components/lesson/LessonCompletion';
import SEOHead from '@/components/SEOHead';

export default function Lesson() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [lines, setLines] = useState([]);
  const [step, setStep] = useState(0); // 0=listen, 1=quiz, 2=flash, 3=done
  const [quizScore, setQuizScore] = useState(0);
  const [wrongWords, setWrongWords] = useState([]);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [l, p] = await Promise.all([getOrCreateTodayLesson(), getProgress()]);
        if (cancelled) return;
        if (!l) { setLoading(false); return; }
        setLesson(l);
        setProgress(p);
        setLines(l._lines || []);
        if (l.completed) {
          setStep(3);
          setResult({ alreadyCompleted: true });
          setQuizScore(l.quiz_score || 0);
        } else {
          setStep(Math.max(0, (l.activity_step || 1) - 1));
        }
      } catch { /* noop */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleListenReady = () => {
    setStep(1);
    updateLessonStep(2).catch(() => {});
  };

  const handleQuizComplete = (score, wrongs) => {
    setQuizScore(score);
    setWrongWords(wrongs);
    setStep(2);
    updateLessonStep(3, { quiz_score: score }).catch(() => {});
  };

  const handleFlashComplete = async () => {
    const wordsTapped = lesson.words_tapped || [];
    const res = await completeTodayLesson({ quizScore, wordsTapped });
    setResult(res);
    setStep(3);
  };

  const seo = (
    <SEOHead
      title="Today's Spanish lesson — 5 minutes | Spanish Beats"
      description="Your daily 5-minute Spanish lesson powered by music. Listen to a chorus, answer 5 quick questions, review 3 words. Build a streak and make Spanish a daily habit."
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {seo}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No lesson available right now.</p>
        <button onClick={() => navigate('/dashboard')} className="text-primary font-medium">Back to dashboard</button>
      </div>
    );
  }

  // Already-completed state (when arriving and lesson is done)
  if (lesson.completed && step === 3 && result?.alreadyCompleted) {
    const xpGain = (lesson.quiz_score || 0) * 10 + 15;
    return (
      <div className="min-h-screen flex flex-col">
        <div className="safe-area-top flex items-center px-4 py-3 border-b border-border">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center animate-checkmark">
            <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">¡Bien hecho!</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-bold">{lesson.quiz_score}/5</span>
            <span>·</span>
            <span>{(lesson.words_tapped || []).length} words</span>
            <span>·</span>
            <span>🔥 {progress?.current_streak || 0} days</span>
          </div>
          <button
            onClick={() => navigate(`/song/${lesson.song_id}`)}
            className="h-11 px-6 rounded-lg bg-primary text-white text-sm font-medium"
          >
            Full song →
          </button>
          <p className="text-xs text-muted-foreground">Come back tomorrow</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {seo}
      <div className="safe-area-top flex items-center px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <LessonHeader lesson={lesson} step={step} resume={step > 0 && !lesson.completed} />

      <div className="flex-1 flex flex-col min-h-0">
        {step === 0 && (
          <ListenActivity lesson={lesson} lines={lines} onReady={handleListenReady} />
        )}
        {step === 1 && (
          <QuizActivity lines={lines} wordsTapped={lesson.words_tapped} onComplete={handleQuizComplete} />
        )}
        {step === 2 && (
          <FlashActivity
            lines={lines}
            wordsTapped={lesson.words_tapped}
            wrongWords={wrongWords}
            onComplete={handleFlashComplete}
          />
        )}
        {step === 3 && result && (
          <LessonCompletion
            quizScore={quizScore}
            wordsTapped={lesson.words_tapped || []}
            xpGain={result.xpGain || quizScore * 10 + 15}
            streak={result.newStreak || progress?.current_streak || 0}
            milestone={result.milestone}
            songId={lesson.song_id}
          />
        )}
      </div>
    </div>
  );
}