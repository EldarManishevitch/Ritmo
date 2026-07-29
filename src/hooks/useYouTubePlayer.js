import { useEffect, useRef, useState, useCallback } from 'react';

let apiPromise = null;
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export function useYouTubePlayer(videoId, containerId) {
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [playbackRate, setPlaybackRateState] = useState(() => {
    try {
      const saved = localStorage.getItem('sbPlaybackRate');
      return saved ? parseFloat(saved) || 1 : 1;
    } catch { return 1; }
  });

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setCurrentTime(0);
    if (!videoId) return;
    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch { /* noop */ }
      }
      playerRef.current = new YT.Player(containerId, {
        videoId,
        playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setReady(true);
            setDuration(e.target.getDuration());
            // Resume at the user's preferred playback rate
            try {
              const saved = localStorage.getItem('sbPlaybackRate');
              const rate = saved ? parseFloat(saved) || 1 : 1;
              if (rate && rate !== 1 && e.target.setPlaybackRate) {
                e.target.setPlaybackRate(rate);
              }
              setPlaybackRateState(rate);
            } catch { /* noop */ }
          },
          onStateChange: (e) => {
            setIsPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.target.getDuration) setDuration(e.target.getDuration());
          },
          onError: (e) => {
            // Codes 2, 5, 100, 101, 150 = video unavailable/restricted.
            // No pre-availability check is performed — we rely on the player's own error event.
            console.warn('YouTube player error:', e.data);
            setError(e.data);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch { /* noop */ }
      }
      playerRef.current = null;
    };
  }, [videoId, containerId]);

  // rAF loop: START on play (state 1), PAUSE on pause/buffer (state 2/3),
  // RESUME on play again, STOP on unmount. Throttled to 250ms reads.
  // Raw YT.Player API — getCurrentTime() is synchronous (returns a number).
  useEffect(() => {
    if (!ready || !isPlaying) return;
    let raf;
    let lastReadAt = 0;
    const tick = () => {
      // Guard: if the player ref is null (destroyed mid-loop), keep rAF alive
      // but skip the read — the effect cleanup will cancel on unmount.
      if (playerRef.current?.getCurrentTime) {
        const now = performance.now();
        if (now - lastReadAt >= 250) {
          lastReadAt = now;
          try {
            setCurrentTime(playerRef.current.getCurrentTime());
          } catch { /* noop */ }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, isPlaying]);

  const seekTo = useCallback((seconds) => {
    try { playerRef.current?.seekTo(Math.max(0, seconds), true); } catch { /* noop */ }
  }, []);

  const play = useCallback(() => { try { playerRef.current?.playVideo(); } catch { /* noop */ } }, []);
  const pause = useCallback(() => { try { playerRef.current?.pauseVideo(); } catch { /* noop */ } }, []);
  const setPlaybackRate = useCallback((rate) => {
    try { playerRef.current?.setPlaybackRate?.(rate); } catch { /* noop */ }
    setPlaybackRateState(rate);
  }, []);

  return { ready, currentTime, isPlaying, duration, error, playbackRate, seekTo, play, pause, setPlaybackRate };
}