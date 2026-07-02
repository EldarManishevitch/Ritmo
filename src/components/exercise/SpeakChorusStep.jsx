import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Mic, Keyboard, Send } from 'lucide-react';
import { prepareChorusBlanks, normalizeSpanish, similarity } from '@/lib/exerciseHelpers';

export default function SpeakChorusStep({ lines, flags, onComplete }) {
  const { targetLines, blankWords } = useMemo(
    () => prepareChorusBlanks(lines || [], flags || []),
    [lines, flags]
  );
  const [mode, setMode] = useState('speak');
  const [results, setResults] = useState({});
  const [inputs, setInputs] = useState({});
  const [listening, setListening] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const recognitionRef = useRef(null);

  const hasSpeech = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const checkWord = useCallback((word, transcript) => {
    return similarity(normalizeSpanish(word), normalizeSpanish(transcript)) >= 0.8;
  }, []);

  const handleSpeak = () => {
    if (!hasSpeech) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'es-MX';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const newResults = { ...results };
      for (const word of blankWords) {
        if (!newResults[word] && checkWord(word, transcript)) {
          newResults[word] = 'correct';
        }
      }
      setResults(newResults);
    };
    recognitionRef.current = rec;
    rec.start();
  };

  const handleSubmit = () => {
    const newResults = {};
    for (const word of blankWords) {
      const input = inputs[word] || '';
      if (input.trim()) {
        newResults[word] = checkWord(word, input) ? 'correct' : 'wrong';
      }
    }
    setResults(newResults);
    setSubmitted(true);
  };

  const correctCount = Object.values(results).filter((v) => v === 'correct').length;

  const renderLine = (line) => {
    let remaining = line.spanish_text;
    const parts = [];
    blankWords.forEach((word) => {
      const lower = remaining.toLowerCase();
      const target = word.toLowerCase();
      const pos = lower.indexOf(target);
      if (pos >= 0) {
        const before = pos > 0 ? remaining[pos - 1] : ' ';
        const after = pos + target.length < remaining.length ? remaining[pos + target.length] : ' ';
        if (!/[a-záéíóúüñ]/i.test(before) && !/[a-záéíóúüñ]/i.test(after)) {
          if (pos > 0) parts.push({ text: remaining.slice(0, pos) });
          parts.push({ blank: word });
          remaining = remaining.slice(pos + target.length);
        }
      }
    });
    if (remaining) parts.push({ text: remaining });
    return parts;
  };

  if (!targetLines.length || !blankWords.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-6">
        Not enough lyrics for the speaking exercise.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Speak the chorus</h2>
        <div className="flex rounded-full bg-muted p-0.5">
          <button onClick={() => setMode('speak')} disabled={!hasSpeech}
            className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${mode === 'speak' ? 'bg-primary text-white' : 'text-muted-foreground'} ${!hasSpeech ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Mic className="h-3.5 w-3.5 inline mr-1" />Speak
          </button>
          <button onClick={() => setMode('type')}
            className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${mode === 'type' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
            <Keyboard className="h-3.5 w-3.5 inline mr-1" />Type
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 mb-4">
          {targetLines.map((line, i) => (
            <div key={line.id || i}>
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {renderLine(line).map((part, j) => {
                  if (part.blank) {
                    const res = results[part.blank];
                    return (
                      <span key={j} className={`inline-block mx-1 px-2 py-0.5 rounded border-b-2 font-bold ${
                        res === 'correct' ? 'border-green-500 text-green-700 bg-green-50' :
                        res === 'wrong' ? 'border-red-500 text-red-700 bg-red-50' :
                        'border-primary text-primary bg-primary/5'
                      }`}>
                        {res === 'wrong' ? part.blank : '______'}
                      </span>
                    );
                  }
                  return <span key={j}>{part.text}</span>;
                })}
              </p>
              {line.english_translation && (
                <p className="text-xs text-muted-foreground italic mt-0.5">{line.english_translation}</p>
              )}
            </div>
          ))}
        </div>

        {mode === 'speak' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <button onClick={handleSpeak} disabled={listening || !hasSpeech}
              className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-white hover:bg-primary/90'
              }`}>
              <Mic className="h-8 w-8" />
            </button>
            <p className="text-xs text-muted-foreground">
              {!hasSpeech ? 'Speech recognition not supported — use Type mode' : listening ? 'Listening…' : 'Tap and speak the lyrics'}
            </p>
          </div>
        )}

        {mode === 'type' && (
          <div className="space-y-3 py-2">
            {blankWords.map((word) => (
              <div key={word} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-shrink-0">"{word}" =</span>
                <input
                  type="text"
                  value={inputs[word] || ''}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [word]: e.target.value }))}
                  disabled={results[word] === 'correct'}
                  className={`flex-1 h-10 rounded-lg border-2 px-3 text-sm bg-card ${
                    results[word] === 'correct' ? 'border-green-500 text-green-700' :
                    results[word] === 'wrong' ? 'border-red-500 text-red-700' :
                    'border-input'
                  }`}
                />
                {results[word] === 'correct' && <span className="text-green-600 text-sm">✓</span>}
                {results[word] === 'wrong' && <span className="text-red-600 text-sm">✗ {word}</span>}
              </div>
            ))}
            {!submitted && (
              <button onClick={handleSubmit} className="w-full h-10 rounded-lg bg-primary text-white text-sm font-medium">
                <Send className="h-4 w-4 inline mr-1" />Submit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{correctCount} of {blankWords.length} correct</span>
        <button onClick={() => onComplete(correctCount, blankWords.length)} className="h-10 px-6 rounded-lg bg-primary text-white text-sm font-medium">
          Finish →
        </button>
      </div>
    </div>
  );
}