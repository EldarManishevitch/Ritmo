import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, AlertTriangle, Target } from 'lucide-react';

/**
 * Renders a CurriculumTrack's grammar syllabus / L1-interference notes /
 * supporting skills / exit criteria (spanish-song-curriculum.md). One
 * data-driven component reused for all 6 levels instead of hardcoding
 * per-level markup.
 */
export default function LevelSyllabus({ track }) {
  const [open, setOpen] = useState(false);
  const hasContent = track.grammar_syllabus?.length || track.l1_interference?.length || track.exit_criteria || track.exit_exam;
  if (!hasContent) return null;

  const exam = track.exit_exam || {};

  const skills = track.supporting_skills || {};

  return (
    <div className="mt-4 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Grammar syllabus & tips
      </button>
      {open && (
        <div className="mt-3 space-y-4 text-sm">
          {track.grammar_syllabus?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Grammar syllabus
              </p>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                {track.grammar_syllabus.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
          {track.l1_interference?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Watch out (English speakers)
              </p>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                {track.l1_interference.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
          {(skills.reading || skills.speaking || skills.writing) && (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">Supporting skills</p>
              <ul className="space-y-1 text-muted-foreground">
                {skills.reading && <li><span className="font-medium text-foreground">Reading:</span> {skills.reading}</li>}
                {skills.speaking && <li><span className="font-medium text-foreground">Speaking:</span> {skills.speaking}</li>}
                {skills.writing && <li><span className="font-medium text-foreground">Writing:</span> {skills.writing}</li>}
              </ul>
            </div>
          )}
          {track.exit_criteria && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">
                <Target className="h-3.5 w-3.5" /> Exit criteria
              </p>
              <p className="text-muted-foreground">{track.exit_criteria}</p>
            </div>
          )}
          {(exam.listening || exam.reading || exam.speaking || exam.writing) && (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">Week 8 transfer mini-exam</p>
              <ul className="space-y-1 text-muted-foreground">
                {exam.listening && <li><span className="font-medium text-foreground">Listening:</span> {exam.listening}</li>}
                {exam.reading && <li><span className="font-medium text-foreground">Reading:</span> {exam.reading}</li>}
                {exam.speaking && <li><span className="font-medium text-foreground">Speaking:</span> {exam.speaking}</li>}
                {exam.writing && <li><span className="font-medium text-foreground">Writing:</span> {exam.writing}</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
