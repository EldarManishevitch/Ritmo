import React, { useState, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { scorePronunciation } from '@/lib/pronunciationScore';

export default function PronunciationKaraoke({
  lineId,
  targetText,
  onPausePlayer,
  onResult,
}) {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  const supported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    recognitionRef.current = null;
    setRecording(false);
  }, []);

  const handleMicClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (recording) { stop(); return; }
      if (!supported) return;
      onPausePlayer?.();
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      setRecording(true);
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        const result = scorePronunciation(targetText, spoken);
        onResult?.(lineId, result);
        setRecording(false);
      };
      recognition.onerror = () => { setRecording(false); };
      recognition.onend = () => { setRecording(false); };
      try { recognition.start(); } catch { setRecording(false); }
    },
    [recording, supported, onPausePlayer, lineId, targetText, onResult, stop]
  );

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleMicClick}
      className={`flex items-center justify-center h-7 w-7 rounded-full transition-all duration-300 flex-shrink-0 ${
        recording
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary'
      }`}
      title={recording ? 'Stop & score' : 'Practice pronunciation'}
    >
      <Mic className="h-3.5 w-3.5" />
    </button>
  );
}