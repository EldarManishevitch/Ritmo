import React, { useMemo, useState } from 'react';
import { extractWords } from '@/lib/exerciseHelpers';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SPANISH_STOPWORDS = new Set(['el','la','los','las','un','una','de','del','al','a','en','y','o','que','se','su','le','lo','me','te','con','por','para','sin','es','mi','tu','no','si','ya']);

/**
 * Build exactly 5 fill-in-the-blank questions from the lesson's chorus lines.
 * Prioritizes words in `wordsTapped` as the blanked word.
 */
function buildQuestions(lines, wordsTapped) {
  if (!lines?.length) return [];
  const tappedSet = new Set((wordsTapped || []).map((w) => w.toLowerCase()));
  const allWords = new Set();
  lines.forEach((l) => extractWords(l.spanish_text).forEach((w) => allWords.add(w)));
  const pool = Array.from(allWords).filter((w) => w.length > 3);

  const candidateLines = shuffle([...lines]);
  const questions = [];
  for (const line of candidateLines) {
    if (questions.length >= 5) break;
    const wordsInLine = extractWords(line.spanish_text).filter((w) => w.length > 3);
    if (!wordsInLine.length) continue;
    // Prefer tapped words in this line
    const tappedInLine = wordsInLine.filter((w) => tappedSet.has(w));
    const correctWord = (tappedInLine[0] || wordsInLine[Math.floor(Math.random() * wordsInLine.length)]);
    if (!correctWord) continue;
    const distractors = shuffle(pool.filter((w) => w !== correctWord)).slice(0, 3);
    if (distractors.length < 3) continue;
    // Build blanked display
    const lower = line.spanish_text.toLowerCase();
    const pos = lower.indexOf(correctWord);
    const blanked = pos >= 0
      ? line.spanish_text.slice(0, pos) + '_____' + line.spanish_text.slice(pos + correctWord.length)
      : line.spanish_text;
    questions.push({ line, correctWord, options: shuffle([correctWord, ...distractors]), blanked });
  }
  return questions;
}

export default function QuizActivity({ lines, wordsTapped, onComplete }) {
  const questions = useMemo(() => buildQuestions(lines, wordsTapped), [lines, wordsTapped]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrongWords, setWrongWords] = useState([]);
  const [showReveal, setShowReveal] = useState(false);

  const q = questions[idx];
  if (!q) return null;

  const handlePick = (opt) => {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.correctWord;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setWrongWords((w) => [...w, q.correctWord]);
      // Upsert PracticeFlag
      import('@/api/base44Client').then(({ base44 }) =>
        base44.entities.PracticeFlag.filter({ word: q.correctWord }).then((flags) => {
          if (flags?.length) {
            base44.entities.PracticeFlag.update(flags[0].id, { miss_count: (flags[0].miss_count || 0) + 1 });
          } else {
            base44.entities.PracticeFlag.create({ word: q.correctWord, miss_count: 1 });
          }
        }).catch(() => {})
      );
    }
    const delay = correct ? 700 : 1200;
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        onComplete(score + (correct ? 1 : 0), wrongWords.concat(correct ? [] : [q.correctWord]));
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
        setShowReveal(false);
      }
    }, delay);
    setShowReveal(true);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Question {idx + 1} of {questions.length}</span>
        <span className="text-sm font-bold text-primary">{score} / {questions.length}</span>
      </div>

      <div className="rounded-xl bg-card border border-border p-5 mb-4 text-center">
        <p className="text-lg font-medium text-foreground leading-relaxed">{q.blanked}</p>
        {q.line.english_translation && (
          <p className="text-sm text-muted-foreground mt-2">{q.line.english_translation}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const isPicked = picked === opt;
          const isCorrect = opt === q.correctWord;
          let cls = 'border-border bg-card text-foreground hover:bg-muted';
          if (picked) {
            if (isCorrect) cls = 'border-green-500 bg-green-50 text-green-700';
            else if (isPicked) cls = 'border-red-500 bg-red-50 text-red-700';
            else cls = 'border-border bg-card text-muted-foreground opacity-60';
          }
          return (
            <button
              key={opt}
              onClick={() => handlePick(opt)}
              disabled={!!picked}
              className={`h-12 rounded-xl border-2 text-sm font-medium transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}