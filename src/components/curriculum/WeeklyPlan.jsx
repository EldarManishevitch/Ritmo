import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Repeat, Ear } from 'lucide-react';

const TIER_STYLES = {
  Input: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Structure: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Output: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Integration: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Assessment: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

/**
 * Renders a CurriculumTrack's 8-week module plan
 * (spanish-song-learning-path.md). One data-driven component reused for
 * all 6 levels instead of hardcoding a per-level week table.
 */
export default function WeeklyPlan({ track }) {
  const [open, setOpen] = useState(false);
  const weeks = track.weekly_plan || [];
  if (!weeks.length) return null;

  return (
    <div className="mt-4 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        8-week plan
      </button>
      {open && (
        <ol className="mt-3 space-y-2.5 text-sm">
          {weeks.map((w) => (
            <li key={w.week} className="flex gap-3">
              <span className="flex-shrink-0 w-6 text-xs font-bold text-muted-foreground pt-0.5">W{w.week}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TIER_STYLES[w.tier] || 'bg-muted text-foreground'}`}>
                    {w.tier}
                  </span>
                  {w.anchor_song_id ? (
                    <Link to={`/song/${w.anchor_song_id}`} className="text-xs font-medium text-foreground hover:underline">
                      {w.anchor_song_title}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-foreground">{w.anchor_song_title}</span>
                  )}
                  {w.is_recycle && <Repeat className="h-3 w-3 text-muted-foreground" aria-label="Recycle week" />}
                </div>
                {w.grammar_focus && w.grammar_focus !== '—' && (
                  <p className="text-xs text-muted-foreground mt-0.5">{w.grammar_focus}</p>
                )}
                <p className="text-xs text-muted-foreground/80 mt-0.5">{w.skill_task}</p>
                {w.listening_cloze_hint && (
                  <p className="flex items-start gap-1 text-[11px] text-muted-foreground/70 mt-0.5 italic">
                    <Ear className="h-3 w-3 flex-shrink-0 mt-0.5" /> {w.listening_cloze_hint}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
