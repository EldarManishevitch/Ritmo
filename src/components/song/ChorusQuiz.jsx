import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { awardQuizCompletion } from '@/lib/progress';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useToast } from '@/components/ui/use-toast';

const cleanWord = (w) => w.toLowerCase().replace(/[¿¡!?.,;:"'()]/g, '').trim();
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

export default function ChorusQuiz({ songId, lines, songTitle, songArtist }) {
  const [seed, setSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const questions = useMemo(() => {
    void seed;
    const metaWords = new Set(
      [songTitle || '', songArtist || ''].join(' ').split(/\s+/).map(cleanWord).filter(Boolean)
    );
    const normalize = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
    const titleNorm = normalize(songTitle || '');
    const artistNorm = normalize(songArtist || '');

    const isValidLyric = (text) => {
      const t = text.trim();
      if (!t) return false;
      if (/^[\[\({].*[\]\)}]\s*:?\s*$/.test(t)) return false;
      const n = normalize(t);
      if (titleNorm && (n === titleNorm || (n.includes(titleNorm) && n.length <= titleNorm.length + 4))) return false;
      if (artistNorm && (n === artistNorm || (n.includes(artistNorm) && n.length <= artistNorm.length + 4))) return false;
      const words = t.split(/\s+/);
      if (words.length < 3) return false;
      if (!words.some((w) => cleanWord(w).length > 3 && !metaWords.has(cleanWord(w)))) return false;
      return true;
    };

    const sorted = [...lines].sort((a, b) => a.line_index - b.line_index);
    const validLines = sorted.filter((l) => isValidLyric(l.spanish_text));
    const allWords = Array.from(
      new Set(
        validLines
          .flatMap((l) => l.spanish_text.split(/\s+/).map(cleanWord))
          .filter((w) => w.length > 3 && !metaWords.has(w))
      )
    );
    if (!validLines.length || allWords.length < 4) return [];
    const count = Math.min(validLines.length, Math.floor(Math.random() * 4) + 5);
    const picked = shuffle(validLines).slice(0, count);
    return picked.map((line) => {
      const words = line.spanish_text.split(/\s+/);
      const candidates = words
        .map((w, i) => ({ w, i, c: cleanWord(w) }))
        .filter((x) => x.c.length > 3 && !metaWords.has(x.c));
      const pick = candidates[Math.floor(Math.random() * candidates.length)] || { w: words[0], i: 0, c: cleanWord(words[0]) };
      const distractors = shuffle(allWords.filter((w) => w !== pick.c)).slice(0, 3);
      return { line, missing: pick.c, options: shuffle([pick.c, ...distractors]), words, missingIdx: pick.i };
    });
  }, [lines, seed, songTitle, songArtist]);

  useEffect(() => {
    setIdx(0);
    setAnswer(null);
    setScore(0);
    setDone(false);
  }, [seed]);

  const q = questions[idx];

  const flagWrong = async (word) => {
    try {
      const existing = await base44.entities.PracticeFlag.filter({ word, song_id: songId });
      if (existing && existing.length) {
        await base44.entities.PracticeFlag.update(existing[0].id, { miss_count: (existing[0].miss_count || 1) + 1 });
      } else {
        await base44.entities.PracticeFlag.create({ word, song_id: songId, miss_count: 1 });
      }
    } catch { /* noop */ }
  };

  const clearFlag = async (word) => {
    try {
      const existing = await base44.entities.PracticeFlag.filter({ word, song_id: songId });
      if (existing && existing.length) {
        await base44.entities.PracticeFlag.delete(existing[0].id);
      }
    } catch { /* noop */ }
  };

  const choose = async (opt) => {
    if (answer) return;
    setAnswer(opt);
    const correct = opt === q.missing;
    if (correct) {
      setScore((s) => s + 1);
      await clearFlag(q.missing);
    } else {
      await flagWrong(q.missing);
    }
  };

  const next = async () => {
    if (idx + 1 >= questions.length) {
      setDone(true);
      // Award XP + streak + count the song + unlock achievements after the full quiz
      try {
        const result = await awardQuizCompletion(score, questions.length);
        if (result?.newAchievements?.length) {
          result.newAchievements.forEach((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id);
            if (a) toast({ title: `${a.icon} ${a.label} unlocked!`, description: a.desc });
          });
        }
      } catch { /* noop */ }
    } else {
      setIdx(idx + 1);
      setAnswer(null);
    }
  };

  const restart = () => {
    setSeed((s) => s + 1);
    setIdx(0);
    setAnswer(null);
    setScore(0);
    setDone(false);
  };

  if (!questions.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No quiz lines available for this song yet.</p>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-3xl font-bold text-foreground">{pct}%</h3>
        <p className="text-muted-foreground mb-4">{score} / {questions.length} correct</p>
        <Button onClick={restart} className="bg-primary text-white">
          <RotateCcw className="h-4 w-4 mr-1" /> Play again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-muted-foreground">Question {idx + 1} / {questions.length}</span>
        <span className="font-semibold text-foreground">Score: {score}</span>
      </div>

      <Card className="p-5 mb-4">
        <p className="text-lg text-foreground leading-relaxed">
          {q.words.map((w, i) => (
            <React.Fragment key={i}>
              {i === q.missingIdx ? (
                <span className="inline-block min-w-[80px] text-center border-b-2 border-primary font-bold text-primary mx-1">
                  {answer || '___'}
                </span>
              ) : w}
              {' '}
            </React.Fragment>
          ))}
        </p>
        {q.line.english_translation && (
          <p className="text-sm text-muted-foreground mt-3 italic">{q.line.english_translation}</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const isCorrect = answer && opt === q.missing;
          const isWrong = answer === opt && opt !== q.missing;
          return (
            <Button
              key={opt}
              onClick={() => choose(opt)}
              disabled={!!answer}
              variant="outline"
              className={`h-auto py-3 ${isCorrect ? 'border-green-500 bg-green-500/10 text-green-600' : ''} ${isWrong ? 'border-destructive bg-destructive/10 text-destructive' : ''}`}
            >
              {isCorrect && <Check className="h-4 w-4 mr-1" />}
              {isWrong && <X className="h-4 w-4 mr-1" />}
              {opt}
            </Button>
          );
        })}
      </div>

      {answer && (
        <Button onClick={next} className="w-full mt-4 bg-primary text-white">
          {idx + 1 >= questions.length ? 'Finish' : 'Next'}
        </Button>
      )}
    </div>
  );
}