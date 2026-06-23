import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch { /* noop */ }
    setSaving(false);
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      {/* Profile */}
      <div className="rounded-2xl bg-card border border-border p-5 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={user?.email || ''} disabled className="pl-9 opacity-60" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {savedFlash ? 'Saved!' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl bg-card border border-border p-5 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h2>
        <p className="text-sm text-foreground">Spanish Beats Learn</p>
        <p className="text-xs text-muted-foreground mt-1">Learn Spanish through synced music lyrics, instant translations, and AI roleplay.</p>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-1" /> Log out
      </Button>
    </div>
  );
}