import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { levelMeta } from '@/lib/curriculum';

export default function CurriculumProgressWidget({ cefrLevel, songsCompleted, totalSlots = 12 }) {
  const meta = levelMeta(cefrLevel);
  const pct = Math.round((songsCompleted / totalSlots) * 100);
  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">{cefrLevel} {meta.name}</span>
          <span className="text-xs text-muted-foreground">{songsCompleted}/{totalSlots} songs · {pct}% complete</span>
        </div>
        <Link to="/curriculum" className="text-xs font-semibold text-primary hover:underline">
          View full curriculum →
        </Link>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}