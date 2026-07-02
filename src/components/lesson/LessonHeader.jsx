import React from 'react';
import { Zap } from 'lucide-react';

const STEP_LABELS = ['Listen', 'Quiz', 'Flash'];

export default function LessonHeader({ lesson, step, resume }) {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="px-4 pt-4 pb-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Today's Lesson</h1>
        </div>
        <span className="text-xs text-muted-foreground">{dateStr} · ~5 min</span>
      </div>

      {resume && (
        <div className="mb-2 text-xs font-medium text-primary bg-primary/10 rounded-lg px-3 py-1.5">
          Continue where you left off
        </div>
      )}

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex items-center gap-1.5 flex-1">
              <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-colors ${
                done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'
              }`}>{i + 1}</span>
              <span className={`text-xs font-medium ${done || active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              {i < 2 && <span className="text-muted-foreground mx-0.5">·</span>}
            </div>
          );
        })}
      </div>

      {/* Song info row */}
      <div className="flex items-center gap-3 mt-3">
        <img
          src={lesson.song_youtube_id ? `https://img.youtube.com/vi/${lesson.song_youtube_id}/mqdefault.jpg` : ''}
          alt={lesson.song_title}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{lesson.song_title}</p>
          <p className="text-xs text-muted-foreground truncate">{lesson.song_artist}</p>
        </div>
        {lesson.song_genre && (
          <span className="ml-auto text-[10px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#2A4B62' }}>
            {lesson.song_genre}
          </span>
        )}
      </div>
    </div>
  );
}