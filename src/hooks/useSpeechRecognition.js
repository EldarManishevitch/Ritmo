import { useRef, useState, useCallback } from 'react';

const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

export const speechSupported = !!SR;

/**
 * Thin wrapper around the browser SpeechRecognition API.
 * lang=es-MX, continuous=false, interimResults=false, 8s timeout.
 */
export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const timeoutRef = useRef(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (recRef.current) {
      try { recRef.current.abort(); } catch { /* noop */ }
      recRef.current = null;
    }
    setListening(false);
  }, []);

  const start = useCallback(({ onResult, onTimeout, onError }) => {
    if (!SR) { onError?.('unsupported'); return; }
    cancel();
    const rec = new SR();
    rec.lang = 'es-MX';
    rec.continuous = false;
    rec.interimResults = false;
    recRef.current = rec;
    let got = false;

    const cleanup = () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      setListening(false);
    };

    rec.onresult = (e) => {
      got = true;
      const transcript = e.results?.[0]?.[0]?.transcript || '';
      cleanup();
      onResult?.(transcript.trim());
    };
    rec.onerror = (e) => { cleanup(); onError?.(e.error); };
    rec.onend = () => { setListening(false); };

    setListening(true);
    try { rec.start(); } catch { /* already started */ }

    timeoutRef.current = setTimeout(() => {
      if (!got) {
        try { rec.stop(); } catch { /* noop */ }
        cleanup();
        onTimeout?.();
      }
    }, 8000);
  }, [cancel]);

  return { listening, start, cancel, supported: speechSupported };
}