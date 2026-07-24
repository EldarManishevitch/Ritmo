import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Loader2, Check, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';

export default function SubscriptionCard() {
  const { isPro, loading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === '1') setUpgraded(true);
  }, []);

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke('createBillingPortalSession', {});
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch { /* noop */ }
    setPortalLoading(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 mb-4">
        <div className="h-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Subscription</h2>
      {upgraded && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 mb-4 flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <p className="text-sm text-foreground">Welcome to Pro! Your subscription is active.</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isPro ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{isPro ? 'Pro' : 'Free'}</p>
            <p className="text-xs text-muted-foreground">{isPro ? 'All features unlocked' : 'Limited features'}</p>
          </div>
        </div>
        {isPro ? (
          <Button variant="outline" onClick={handleManage} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
            Manage
          </Button>
        ) : (
          <Button asChild>
            <Link to="/pricing"><Crown className="h-4 w-4 mr-1" /> Upgrade to Pro</Link>
          </Button>
        )}
      </div>
    </div>
  );
}