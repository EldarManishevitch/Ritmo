import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Play } from 'lucide-react';
import { scorePronunciation } from '@/lib/pronunciationScore';

export default function PronunciationCheck({ targetText }) {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const speechSupported =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const micSupported =
    typeof window !== 'undefined' && !!navigator.mediaDevices && !!window.MediaRecorder;

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    recognitionRef.current = null;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch { /* noop */ }
    setRecording(false);
  }, []);

  const handleMicClick = useCallback(() => {
    if (recording) { stop(); return; }
    setResult(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    chunksRef.current = [];

    // Speech recognition for scoring
    if (speechSupported) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setResult(scorePronunciation(targetText, spoken));
      };
      recognition.onerror = () => {};
      recognition.onend = () => {};
      try { recognition.start(); } catch { /* noop */ }
    }

    // Audio recording for playback comparison
    if (micSupported) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mr = new MediaRecorder(stream);
          mediaRecorderRef.current = mr;
          mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
          mr.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            setAudioUrl(URL.createObjectURL(blob));
            stream.getTracks().forEach((t) => t.stop());
          };
          try { mr.start(); } catch { /* noop */ }
        })
        .catch(() => {});
    }

    setRecording(true);
  }, [recording, speechSupported, micSupported, targetText, stop, audioUrl]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  if (!speechSupported && !micSupported) return null;

  const playRecording = () => {
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleMicClick}
        className={`flex items-center justify-center h-9 w-9 rounded-full transition-all duration-300 flex-shrink-0 ${
          recording ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/15 text-primary hover:bg-primary/25'
        }`}
        title={recording ? 'Stop recording' : 'Record & check pronunciation'}
      >
        <Mic className="h-4 w-4" />
      </button>
      {audioUrl && !recording && (
        <button
          type="button"
          onClick={playRecording}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex-shrink-0"
          title="Play your recording"
        >
          <Play className="h-4 w-4" />
        </button>
      )}
      {result && (
        <span className={`text-sm font-semibold ${result.score >= 80 ? 'text-green-600' : result.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
          {result.score}%
        </span>
      )}
      <audio ref={audioRef} src={audioUrl || undefined} className="hidden" />
    </div>
  );
}