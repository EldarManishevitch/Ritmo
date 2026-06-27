import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleCard({ header, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        {header}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}