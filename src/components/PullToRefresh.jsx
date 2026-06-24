import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const THRESHOLD = 70;
const MAX_PULL = 120;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;
  const stateRef = useRef({ isPulling: false, refreshing: false, pullDistance: 0 });
  stateRef.current = { isPulling, refreshing, pullDistance };

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY <= 0 && !stateRef.current.refreshing) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!stateRef.current.isPulling || stateRef.current.refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY <= 0) {
        setPullDistance(Math.min(delta * 0.5, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (!stateRef.current.isPulling) return;
      setIsPulling(false);
      if (stateRef.current.pullDistance >= THRESHOLD) {
        setRefreshing(true);
        setPullDistance(THRESHOLD);
        try {
          await refreshRef.current?.();
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance > 0 ? pullDistance : 0,
          transition: isPulling ? 'none' : 'height 0.3s ease',
        }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : pullDistance > 10 ? (
          <RefreshCw
            className="h-5 w-5 text-primary"
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        ) : null}
      </div>
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </>
  );
}