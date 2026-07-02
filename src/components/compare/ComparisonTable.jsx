import React from 'react';

export default function ComparisonTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] bg-muted/50">
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feature</div>
        <div className="px-4 py-3 text-sm font-bold text-primary whitespace-nowrap min-w-[90px] text-center">Spanish Beats</div>
        <div className="px-4 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap min-w-[90px] text-center">Competitor</div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center bg-card">
            <div className="px-4 py-3 text-sm text-foreground">{row.feature}</div>
            <div className="px-4 py-3 text-sm font-medium text-center min-w-[90px]">
              {row.sb === true ? <Check /> : row.sb === false ? <Cross /> : <span className="whitespace-pre-line">{row.sb}</span>}
            </div>
            <div className="px-4 py-3 text-sm text-center text-muted-foreground min-w-[90px]">
              {row.cp === true ? <Check /> : row.cp === false ? <Cross /> : <span className="whitespace-pre-line">{row.cp}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Check = () => <span className="text-green-600 font-bold">✓</span>;
const Cross = () => <span className="text-destructive font-bold">✗</span>;