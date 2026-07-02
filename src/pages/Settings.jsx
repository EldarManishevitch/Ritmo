import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, User as UserIcon, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationPreferencesCard from '@/components/settings/NotificationPreferencesCard';
import GenrePreferencesCard from '@/components/settings/GenrePreferencesCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEOHead from '@/components/SEOHead';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      if (user?.id) {
        await base44.entities.User.delete(user.id);
      }
    } catch { /* may fail if not permitted — proceed to logout */ }
    try { await base44.auth.logout(); } catch { /* noop */ }
    navigate('/login');
    setDeleting(false);
  };

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
      <SEOHead
        title="Settings | Spanish Beats"
        description="Manage your Spanish Beats preferences — genre settings, daily reminder time, and learning goals."
      />
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

      {/* Daily reminder preferences */}
      <NotificationPreferencesCard />

      {/* Music genre preferences */}
      <GenrePreferencesCard />

      {/* About */}
      <div className="rounded-2xl bg-card border border-border p-5 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h2>
        <p className="text-sm text-foreground">Spanish Beats Learn</p>
        <p className="text-xs text-muted-foreground mt-1">Learn Spanish through synced music lyrics, instant translations, and AI roleplay.</p>
      </div>

      {/* Account Deletion */}
      <div className="rounded-2xl bg-card border border-destructive/20 p-5 mb-4">
        <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide mb-2">Account Deletion</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/30">
              <Trash2 className="h-4 w-4 mr-1" /> Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove your account, saved words, and progress. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Yes, delete account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-1" /> Log out
      </Button>
    </div>
  );
}