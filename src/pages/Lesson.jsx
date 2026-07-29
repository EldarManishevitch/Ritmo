import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Check, Music, BookOpen, Trophy } from 'lucide-react';
import { completeTodayLesson, updateLessonStep } from '@/lib/dailyLesson';
import { useTodayLesson } from '@/data/hooks/useDailyLesson';
import { useUserProgress } from '@/data/hooks/useUserProgress';
import LessonHeader from '@/components/lesson/LessonHeader';
import ListenActivity from '@/components/lesson/ListenActivity';
import QuizActivity from '@/components/lesson/QuizActivity';
import FlashActivity from '@/components/lesson/FlashActivity';
import LessonCompletion from '@/components/lesson/LessonCompletion';
import SEOHead from '@/components/SEOHead';

export default function Lesson() {
  const navigate = useNavigate();
  // lesson/lines/step are local, actively-mutated session state (each activity
  // step reads and advances them) — seeded from the query below, not bound to it.
  const [lesson, setLesson] = useState(null);
  const [lines, setLines] = useState([]);
  const [step, setStep] = useState(0); // 0=listen, 1=quiz, 2=flash, 3=done
  const [quizScore, setQuizScore] = useState(0);
  const [wrongWords, setWrongWords] = useState([]);
  const [result, setResult] = useState(null);

  const { data: initialLesson, isLoading: lessonLoading } = useTodayLesson();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const loading = lessonLoading || progressLoading;
  const queryClient = useQueryClient();

  // Spec 3.3: the first-session tutorial (tap → save → grammar → quiz → Roleplay
  // prompt) only exists on the full song page (useFirstSongTutorial in SongPage.jsx).
  // If a brand-new user's first click is "Daily" instead of a song, sending them
  // into this page's compact Listen/Quiz/Flash flow would skip that tutorial
  // entirely. Redirect them to the same song via the full page instead, so the one
  // tutorial implementation stays authoritative rather than duplicating it here.
  useEffect(() => {
    if (loading || !initialLesson || initialLesson.completed) return;
    const isFirstTimer = (progress?.songs_completed || 0) === 0 && !localStorage.getItem('sb_first_song_tutorial_done');
    if (isFirstTimer && initialLesson.song_id) {
      navigate(`/song/${initialLesson.song_id}`, { replace: true });
    }
  }, [loading, initialLesson, progress, navigate]);

  useEffect(() => {
    if (!initialLesson) return;
    setLesson(initialLesson);
    setLines([...(initialLesson._lines || [])].sort((a, b) => (a.line_index ?? 0) - (b.line_index ?? 0)));
    if (initialLesson.completed) {
      setStep(3);
      setResult({ alreadyCompleted: true });
      setQuizScore(initialLesson.quiz_score || 0);
    } else {
      setStep(Math.max(0, (initialLesson.activity_step || 1) - 1));
    }
  }, [initialLesson]);

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
    // Reflect completion + streak immediately anywhere else "today's lesson" is read (the Dashboard banner).
    queryClient.invalidateQueries({ queryKey: ['dailyLesson', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['userProgress', 'current'] });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <SEOHead
        title="Today's Spanish lesson — 5 minutes | Spanish Beats"
        description="Your daily 5-minute Spanish lesson powered by music. Listen to a chorus, answer 5 quick questions, review 3 words. Build a streak and make Spanish a daily habit."
      />
      <div className="safe-area-top flex items-center px-4 py-3 border-b border-border">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <LessonHeader lesson={lesson} step={step} resume={step > 0 && !lesson.completed} />

      {/* Tab pills — matches the song page */}
      <div className="px-4 py-3 flex gap-2 border-b border-border">
        {[
          { id: 'listen', label: 'Lyrics', icon: Music },
          { id: 'quiz', label: 'Quiz', icon: Trophy },
          { id: 'flash', label: 'Vocab', icon: BookOpen },
        ].map((t, i) => {
          const Icon = t.icon;
          const active = step === i;
          return (
            <button
              key={t.id}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Lyrics ready status bar — matches the song page */}
      <div className="px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium border-b bg-green-100 text-green-700 border-green-200">
        <span>✅</span>
        <span>Lyrics ready (synced)</span>
      </div>

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