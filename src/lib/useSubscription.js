import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getProgress } from '@/lib/progress';

export function useSubscription() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProgress()
      .then((p) => {
        if (cancelled) return;
        setIsPro(p?.subscription_status === 'pro');
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { isPro, loading };
}