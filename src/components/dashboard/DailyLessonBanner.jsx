import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Check } from 'lucide-react';
import { dailyLessonRepo } from '@/data/repositories/dailyLesson.repo';
import { getProgress } from '@/lib/progress';
import { todayStr, getOrCreateTodayLesson } from '@/lib/dailyLesson';

export default function DailyLessonBanner() {
  const [state, setState] = useState(null); // { lesson, progress } or null while loading

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const progress = await getProgress();
        const today = todayStr();
        const existing = await dailyLessonRepo.byDate(today);
        if (existing?.length) {
          if (!cancelled) setState({ lesson: existing[0], progress });
          return;
        }
        // No lesson yet — create one (this also picks the song)
        const lesson = await getOrCreateTodayLesson();
        if (!cancelled) setState({ lesson, progress });
      } catch {
        if (!cancelled) setState({ error: true });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!state) return null;
  if (state.error) return null;

  const { lesson, progress } = state;
  const streak = progress?.current_streak || 0;
  const done = lesson?.completed;

  if (done) {
    return (
      <Link to="/lesson" className="block mb-6 rounded-2xl bg-green-50 border border-green-200 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800">✓ Today's lesson done · {lesson.quiz_score}/5</p>
            <p className="text-xs text-green-700">Come back tomorrow</p>
          </div>
        </div>
        <span className="text-sm font-bold text-green-800 flex-shrink-0">🔥 {streak}</span>
      </Link>
    );
  }

  const isFirstDay = !progress?.last_activity_date && streak === 0;

  return (
    <Link to="/lesson" className="block mb-6 rounded-2xl bg-primary text-white p-4 flex items-center justify-between gap-3 hover:bg-primary/90 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Zap className="h-5 w-5 flex-shrink-0" />
        <div className="min-w-0">
          {isFirstDay ? (
            <>
              <p className="text-sm font-bold">Start your streak today 🔥</p>
              <p className="text-xs text-white/80">First lesson ready · 5 min</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold">🔥 {streak} day streak · Today's lesson</p>
              <p className="text-xs text-white/80 truncate">{lesson?.song_title} · {lesson?.song_artist} · 5 min</p>
            </>
          )}
        </div>
      </div>
      <span className="text-sm font-bold bg-white/20 px-3 py-1.5 rounded-full flex-shrink-0">Start →</span>
    </Link>
  );
}