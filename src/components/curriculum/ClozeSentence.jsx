import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** One self-check fill-in-the-blank row: type a guess, reveal the answer key. */
export default function ClozeSentence({ sentence }) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const normalize = (s) => (s || '').trim().toLowerCase();
  const isOpenEnded = sentence.answer?.startsWith('(');
  const isCorrect = !isOpenEnded && revealed && normalize(value) === normalize(sentence.answer);

  return (
    <div className="py-2">
      <p className="text-sm text-foreground">{sentence.prompt}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your answer"
          className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="flex items-center gap-1 text-xs font-medium text-primary flex-shrink-0"
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {revealed ? 'Hide' : 'Check'}
        </button>
      </div>
      {revealed && (
        <p className={`text-xs mt-1 ${isOpenEnded ? 'text-muted-foreground' : isCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
          Answer: <span className="font-semibold">{sentence.answer}</span>
          {sentence.note && <span className="text-muted-foreground"> ({sentence.note})</span>}
        </p>
      )}
    </div>
  );
}
