import React from 'react';
import CollapsibleSection from '@/components/curriculum/CollapsibleSection';

const PRINCIPLES = [
  { title: 'Every level’s assessment listens to an unstudied song.', desc: 'Passing the anchors proves memory; passing a fresh one proves competence. This is the guardrail.' },
  { title: 'Recycle weeks are deliberate.', desc: 'A song reappears once so the structure moves from recognition to production.' },
  { title: 'Accent spread is built in.', desc: 'Spain, Mexico, Caribbean, Andes, Río de la Plata — so the ear generalizes by C1.' },
];

export default function ProgramPrinciples() {
  return (
    <CollapsibleSection title="How the program is built" subtitle="A few ground rules that hold across every level">
      <ul className="space-y-3 text-sm">
        {PRINCIPLES.map((p) => (
          <li key={p.title}>
            <span className="font-medium text-foreground">{p.title}</span>{' '}
            <span className="text-muted-foreground">{p.desc}</span>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
