import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Reads the current user's UserProgress.subscription_status.
 * Returns { isPro: boolean, loading: boolean }.
 * Admins set subscription_status manually on the UserProgress entity.
 */
export function useSubscription() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.entities.UserProgress.filter({})
      .then((list) => {
        if (cancelled) return;
        const progress = list?.[0];
        const subPro = progress?.subscription_status === 'pro';
        const passportTrial =
          !!progress?.passport_pro_trial_expires_at &&
          new Date(progress.passport_pro_trial_expires_at + 'T23:59:59') > new Date();
        setIsPro(subPro || passportTrial);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { isPro, loading };
}