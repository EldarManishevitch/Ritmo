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
          },
          onStateChange: (e) => {
            setIsPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.target.getDuration) setDuration(e.target.getDuration());
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

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      try {
        if (playerRef.current?.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      } catch { /* noop */ }
    }, 200);
    return () => clearInterval(interval);
  }, [ready]);

  const seekTo = useCallback((seconds) => {
    try { playerRef.current?.seekTo(Math.max(0, seconds), true); } catch { /* noop */ }
  }, []);

  const play = useCallback(() => { try { playerRef.current?.playVideo(); } catch { /* noop */ } }, []);
  const pause = useCallback(() => { try { playerRef.current?.pauseVideo(); } catch { /* noop */ } }, []);

  return { ready, currentTime, isPlaying, duration, seekTo, play, pause };
}