import React, { useState, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { scorePronunciation } from '@/lib/pronunciationScore';

export default function PronunciationCheck({ targetText }) {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);

  const supported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    recognitionRef.current = null;
    setRecording(false);
  }, []);

  const handleMicClick = useCallback(() => {
    if (recording) { stop(); return; }
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setRecording(true);
    setResult(null);
    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      setResult(scorePronunciation(targetText, spoken));
      setRecording(false);
    };
    recognition.onerror = () => { setRecording(false); };
    recognition.onend = () => { setRecording(false); };
    try { recognition.start(); } catch { setRecording(false); }
  }, [recording, supported, targetText, stop]);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleMicClick}
        className={`flex items-center justify-center h-9 w-9 rounded-full transition-all duration-300 flex-shrink-0 ${
          recording ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/15 text-primary hover:bg-primary/25'
        }`}
        title={recording ? 'Stop & score' : 'Practice pronunciation'}
      >
        <Mic className="h-4 w-4" />
      </button>
      {result && (
        <span className={`text-sm font-semibold ${result.score >= 80 ? 'text-green-600' : result.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
          {result.score}%
        </span>
      )}
    </div>
  );
}