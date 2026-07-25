import React, { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useUpdateUserProgress } from '@/data/hooks/useUserProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { getProgress } from '@/lib/progress';

export default function NotificationPreferencesCard() {
  const { toast } = useToast();
  const [progress, setProgress] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('18:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const updateUserProgress = useUpdateUserProgress();

  useEffect(() => {
    getProgress()
      .then((p) => {
        setProgress(p);
        setEnabled(!!p.notifications_enabled);
        setTime(p.notifications_time || '18:00');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!progress) return;
    setSaving(true);
    try {
      await updateUserProgress.mutateAsync({ id: progress.id, patch: {
        notifications_enabled: enabled,
        notifications_time: time,
      } });
      toast({ title: 'Notification preferences saved.' });
    } catch { /* noop */ }
    setSaving(false);
  };

  if (loading) {
    return <div className="rounded-2xl bg-card border border-border p-5 mb-4 animate-pulse h-44" />;
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notifications</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Culturally-relevant nudges that match your music taste.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Daily learning reminder</p>
            <p className="text-xs text-muted-foreground">Get a nudge to practice each day.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className={enabled ? '' : 'opacity-50 pointer-events-none'}>
          <label className="text-xs text-muted-foreground mb-1 block">Preferred time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-36"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Save preferences
        </Button>
      </div>
    </div>
  );
}