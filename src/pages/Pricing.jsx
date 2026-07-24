import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Loader2, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import TopNav from '@/components/layout/TopNav';

const FEATURES = [
  { label: 'Daily lesson song', free: true, pro: true },
  { label: 'Tap-to-translate lyrics', free: true, pro: true },
  { label: 'Karaoke synced lyrics', free: true, pro: true },
  { label: 'CEFR curriculum A1→C1', free: true, pro: true },
  { label: 'Song catalog access', free: '10-15 rotating', pro: 'All songs' },
  { label: 'Saved vocabulary', free: 'Up to 50', pro: 'Unlimited' },
  { label: 'AI Voice Coach', free: false, pro: true },
  { label: 'Roleplay voice mode', free: false, pro: true },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isPro, loading: subLoading } = useSubscription();

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        window.location.href = '/register';
        return;
      }
      const res = await base44.functions.invoke('createCheckoutSession', { plan: annual ? 'annual' : 'monthly' });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError('Could not start checkout. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const monthlyPrice = 8.99;
  const annualPrice = 59.99;
  const annualMonthlyEquiv = (annualPrice / 12).toFixed(2);

  const Cell = ({ val }) => {
    if (val === true) return <Check className="h-4 w-4 text-primary mx-auto" />;
    if (val === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
    return <span className="text-xs font-medium text-foreground">{val}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing — Pro Plan | Spanish Beats"
        description="Upgrade to Spanish Beats Pro for unlimited vocabulary, full song catalog access, and AI voice coaching. $8.99/month or $59.99/year."
      />
      <TopNav />

      <div className="max-w-3xl mx-auto px-4 pt-12 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Choose your plan</h1>
          <p className="text-muted-foreground">Learn Spanish through music. Upgrade for the full experience.</p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-primary' : 'bg-muted'}`}
            aria-label="Toggle billing period"
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>Annual</span>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Save 44%</span>
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Free */}
          <div className="rounded-2xl bg-card border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Free</h2>
            <p className="text-sm text-muted-foreground mb-4">Start learning today</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <Button variant="outline" className="w-full mb-6" asChild>
              <Link to="/register">Get started</Link>
            </Button>
            <ul className="space-y-2">
              {FEATURES.filter(f => f.free !== false).map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{f.label}{typeof f.free === 'string' ? ` (${f.free})` : ''}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-2xl bg-card border-2 border-primary p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              RECOMMENDED
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Pro</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Unlock everything</p>
            <div className="mb-6">
              {subLoading ? (
                <div className="h-9 w-32 bg-muted animate-pulse rounded" />
              ) : isPro ? (
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Check className="h-5 w-5" /> You're Pro!
                </div>
              ) : (
                <>
                  <span className="text-4xl font-bold text-foreground">
                    ${annual ? annualMonthlyEquiv : monthlyPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                  {annual && (
                    <p className="text-xs text-muted-foreground mt-1">${annualPrice} billed annually</p>
                  )}
                </>
              )}
            </div>
            {isPro ? (
              <Button variant="outline" className="w-full mb-6" asChild>
                <Link to="/settings">Manage subscription</Link>
              </Button>
            ) : (
              <Button className="w-full mb-6" onClick={handleUpgrade} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Crown className="h-4 w-4 mr-1" />}
                Upgrade to Pro
              </Button>
            )}
            <ul className="space-y-2">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{f.label}{typeof f.pro === 'string' ? ` (${f.pro})` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error && <p className="text-center text-sm text-destructive mb-4">{error}</p>}

        {/* Feature comparison table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                <th className="text-center p-4 font-semibold text-muted-foreground">Free</th>
                <th className="text-center p-4 font-semibold text-primary">Pro</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.label} className="border-b border-border/50 last:border-0">
                  <td className="p-4 text-foreground">{f.label}</td>
                  <td className="p-4 text-center"><Cell val={f.free} /></td>
                  <td className="p-4 text-center"><Cell val={f.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}