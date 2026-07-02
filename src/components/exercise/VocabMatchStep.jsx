import React, { useState, useEffect } from 'react';
import { prepareVocabPairs } from '@/lib/exerciseHelpers';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabMatchStep({ song, savedWords, lines, onComplete }) {
  const [pairs, setPairs] = useState([]);
  const [englishShuffled, setEnglishShuffled] = useState([]);
  const [selectedSpanish, setSelectedSpanish] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrongPair, setWrongPair] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    (async () => {
      const p = await prepareVocabPairs(savedWords || [], lines || []);
      if (done) return;
      setPairs(p);
      setEnglishShuffled(shuffle(p.map((x) => x.english)));
      setLoading(false);
    })();
    return () => { done = true; };
  }, [savedWords, lines]);

  const matchCount = Object.keys(matched).length;

  const handleEnglishClick = (english) => {
    if (!selectedSpanish || matched[selectedSpanish]) return;
    const pair = pairs.find((p) => p.spanish === selectedSpanish);
    if (!pair) return;
    if (pair.english === english) {
      const newMatched = { ...matched, [selectedSpanish]: true };
      setMatched(newMatched);
      setSelectedSpanish(null);
      if (Object.keys(newMatched).length >= pairs.length) {
        setTimeout(() => onComplete(pairs.length, pairs.length), 600);
      }
    } else {
      setWrongPair({ spanish: selectedSpanish, english });
      setTimeout(() => { setWrongPair(null); setSelectedSpanish(null); }, 500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!pairs.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-6">
        No vocabulary available for this song yet.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Match the pairs</h2>
        <span className="text-sm font-bold text-primary">{matchCount}/{pairs.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        <div className="space-y-2">
          {pairs.map((p) => {
            const isMatched = matched[p.spanish];
            const isSelected = selectedSpanish === p.spanish;
            const isWrong = wrongPair?.spanish === p.spanish;
            return (
              <button key={p.spanish} disabled={isMatched}
                onClick={() => !isMatched && setSelectedSpanish(p.spanish)}
                className={`w-full h-14 rounded-xl border-2 px-3 text-sm font-medium transition-all ${
                  isMatched ? 'border-green-500 bg-green-50 text-green-700' :
                  isWrong ? 'border-red-500 bg-red-50 text-red-700 animate-shake' :
                  isSelected ? 'border-primary bg-primary/5 text-primary scale-[1.02]' :
                  'border-border bg-card text-foreground hover:border-primary/50'
                }`}>
                {p.spanish}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {englishShuffled.map((eng) => {
            const matchedSpanish = Object.keys(matched).find((sp) =>
              pairs.find((p) => p.spanish === sp)?.english === eng);
            const isMatched = !!matchedSpanish;
            const isWrong = wrongPair?.english === eng;
            return (
              <button key={eng} disabled={isMatched}
                onClick={() => handleEnglishClick(eng)}
                className={`w-full h-14 rounded-xl border-2 px-3 text-sm font-medium transition-all ${
                  isMatched ? 'border-green-500 bg-green-50 text-green-700' :
                  isWrong ? 'border-red-500 bg-red-50 text-red-700 animate-shake' :
                  'border-border bg-card text-foreground hover:border-primary/50'
                }`}>
                {eng}
              </button>
            );
          })}
        </div>
      </div>
      {matchCount >= pairs.length && (
        <p className="text-center py-3 text-sm font-bold text-green-600">All matched! 🎉</p>
      )}
    </div>
  );
}