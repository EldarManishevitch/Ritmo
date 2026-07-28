import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import { useGrammarClozeForLevel } from '@/data/hooks/useGrammarCloze';
import ClozeSentence from '@/components/curriculum/ClozeSentence';

/**
 * Interactive grammar-cloze practice for a CEFR level
 * (spanish-song-learning-path.md — the "ready to print" grammar clozes).
 * One data-driven component reused for all 6 levels.
 */
export default function GrammarPracticeSet({ cefrLevel }) {
  const [open, setOpen] = useState(false);
  const { data: sets = [] } = useGrammarClozeForLevel(cefrLevel, { enabled: open });

  return (
    <div className="mt-4 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        <PenLine className="h-3.5 w-3.5" />
        Grammar practice
      </button>
      {open && (
        <div className="mt-3 space-y-5">
          {sets.map((set) => (
            <div key={set.id}>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">{set.title}</p>
              <p className="text-xs text-muted-foreground mb-1">{set.instructions}</p>
              <div className="divide-y divide-border/60">
                {(set.sentences || []).map((s, i) => <ClozeSentence key={i} sentence={s} />)}
              </div>
            </div>
          ))}
          {!sets.length && <p className="text-xs text-muted-foreground">No practice sets for this level yet.</p>}
        </div>
      )}
    </div>
  );
}
