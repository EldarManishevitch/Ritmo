import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

export default function LessonCompletion({ quizScore, wordsTapped, xpGain, streak, milestone, songId }) {
  const navigate = useNavigate();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4 relative">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              width: '4px',
              height: '8px',
              backgroundColor: ['#D96B43', '#8B5CF6', '#F5C518', '#2DD4BF', '#4CAF50'][i % 5],
              animation: `confetti-fall ${0.8 + Math.random() * 0.8}s ${Math.random()}s linear forwards`,
            }}
          />
        ))}
      </div>

      <div className="text-6xl animate-pulse">🔥</div>
      <h1 className="text-3xl font-medium text-foreground">¡Bien hecho!</h1>
      <p className="text-sm text-muted-foreground">Lesson complete · {dateStr}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-md">
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Quiz</p>
          <p className="text-lg font-bold text-foreground">{quizScore}/5</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Words</p>
          <p className="text-lg font-bold text-foreground">{wordsTapped.length}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">XP</p>
          <p className="text-lg font-bold text-primary">+{xpGain}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className="text-lg font-bold text-foreground">🔥 {streak}</p>
        </div>
      </div>

      {milestone && (
        <div className="text-lg font-bold text-primary animate-checkmark">{milestone}</div>
      )}

      <div className="flex flex-col w-full max-w-md gap-2 mt-2">
        <button
          onClick={() => navigate(`/song/${songId}`)}
          className="h-11 rounded-lg bg-primary text-white text-sm font-medium flex items-center justify-center gap-2"
        >
          Explore the full song <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="h-11 rounded-lg text-sm font-medium text-muted-foreground"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}