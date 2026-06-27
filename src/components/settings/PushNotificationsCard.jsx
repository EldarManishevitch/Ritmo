import React, { useState } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushNotificationsCard() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    setError(null);
    const res = subscribed ? await unsubscribe() : await subscribe();
    if (res && !res.ok) setError(res.error);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-4">
      <div className="flex items-center gap-2 mb-2">
        {subscribed ? <BellRing className="h-4 w-4 text-primary" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Daily Streak Reminders</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Get a daily push notification to keep your learning streak alive and stay motivated.
      </p>
      {!supported ? (
        <p className="text-xs text-muted-foreground">Push notifications aren't supported in this browser.</p>
      ) : (
        <>
          <Button
            onClick={handleToggle}
            disabled={loading}
            variant={subscribed ? 'outline' : 'default'}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {subscribed ? 'Disable reminders' : 'Enable reminders'}
          </Button>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          {subscribed && permission === 'granted' && (
            <p className="text-xs text-muted-foreground mt-2">You're all set — we'll nudge you each day.</p>
          )}
        </>
      )}
    </div>
  );
}