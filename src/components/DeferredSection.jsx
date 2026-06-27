import React, { useEffect, useState } from 'react';

/**
 * Renders children only after a brief idle delay, keeping the initial page
 * paint fast. Falls back to a minimal opaque placeholder until mounted.
 */
export default function DeferredSection({ children, delay = 100 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!show) return <div className="min-h-[60px]" />;

  return <>{children}</>;
}