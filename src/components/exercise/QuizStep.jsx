import React, { useState, useMemo, useEffect } from 'react';
import { generateQuizQuestions, buildBlankedLine } from '@/lib/exerciseHelpers';
import { base44 } from '@/api/base44Client';

export default function QuizStep({ lines, savedWords, onComplete }) {
  const questions = useMemo(() => generateQuizQuestions(lines, savedWords), [lines, savedWords]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setFeedback(null);
    setShowResults(false);
  }, [questions]);

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-6">
        No quiz questions available yet — lyrics are still loading.
      </div>
    );
  }

  const q = questions[currentQ];

  const handleSelect = async (option) => {
    if (feedback) return;
    setSelected(option);
    const isCorrect = option === q.correctWord;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      try {
        const existing = await base44.entities.PracticeFlag.filter({ word: q.correctWord }).catch(() => []);
        if (existing?.length) {
          await base44.entities.PracticeFlag.update(existing[0].id, { miss_count: (existing[0].miss_count || 1) + 1 });
        } else {
          await base44.entities.PracticeFlag.create({ word: q.correctWord, miss_count: 1 });
        }
      } catch { /* noop */ }
    }
    const delay = isCorrect ? 800 : 1200;
    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        setShowResults(true);
      } else {
        setCurrentQ((i) => i + 1);
        setSelected(null);
        setFeedback(null);
      }
    }, delay);
  };

  if (showResults) {
    const passed = score >= 7;
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <div className={`text-5xl font-bold ${passed ? 'text-green-600' : 'text-orange-500'}`}>{score}/{questions.length}</div>
        <p className="text-sm text-muted-foreground max-w-xs">
          {passed ? '¡Bien hecho! You passed.' : 'Keep practicing — you need 7/10 to pass.'}
        </p>
        <div className="flex gap-2 mt-2">
          {!passed && (
            <button
              onClick={() => { setCurrentQ(0); setScore(0); setSelected(null); setFeedback(null); setShowResults(false); }}
              className="h-10 px-6 rounded-lg bg-primary text-white text-sm font-medium"
            >
              Try again
            </button>
          )}
          <button
            onClick={() => onComplete(score, questions.length)}
            className="h-10 px-6 rounded-lg border border-border text-sm font-medium text-foreground"
          >
            {passed ? 'Continue →' : 'Skip'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
        <span className="text-sm font-bold text-primary">{score} correct</span>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        <p className="text-lg font-medium text-foreground leading-relaxed mb-3 text-center">
          {buildBlankedLine(q.line.spanish_text, q.correctWord)}
        </p>
        {q.line.english_translation && (
          <p className="text-sm text-muted-foreground mb-6 text-center italic">{q.line.english_translation}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q.options.map((opt) => {
            const isCorrectOpt = opt === q.correctWord;
            const isSelectedOpt = opt === selected;
            let cls = 'border-border bg-card text-foreground hover:border-primary/50';
            if (feedback) {
              if (isCorrectOpt) cls = 'border-green-500 bg-green-50 text-green-700';
              else if (isSelectedOpt) cls = 'border-red-500 bg-red-50 text-red-700';
              else cls = 'border-border bg-card text-muted-foreground opacity-60';
            }
            return (
              <button key={opt} onClick={() => handleSelect(opt)} disabled={!!feedback}
                className={`h-12 rounded-xl border-2 px-4 text-sm font-medium transition-all ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}