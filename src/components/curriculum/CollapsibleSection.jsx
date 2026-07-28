import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Shared header+toggle shell for page-level collapsible info cards.
 * Used by CurriculumMethodology and ProgramPrinciples so the open/close
 * chrome isn't duplicated per section.
 */
export default function CollapsibleSection({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-6">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full text-left">
        <div>
          <h2 className="font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}
