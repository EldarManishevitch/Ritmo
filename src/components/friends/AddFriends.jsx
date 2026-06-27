import React, { useEffect, useState } from 'react';
import { UserPlus, Smartphone, Check, X, Loader2, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const contactsSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

export default function AddFriends({ onRefresh }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [data, setData] = useState({ accepted: [], pendingSent: [], pendingReceived: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await base44.functions.invoke('friends', { action: 'list' });
      setData(res.data || { accepted: [], pendingSent: [], pendingReceived: [] });
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addEmail = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await base44.functions.invoke('friends', { action: 'add', email: email.trim() });
      const d = res.data;
      if (d?.error) {
        setMsg({ type: 'error', text: d.error });
      } else {
        setEmail('');
        setMsg({ type: 'ok', text: d.status === 'invited' ? 'Invite sent — they will be added when they join.' : 'Friend request sent!' });
        await load();
        onRefresh?.();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setBusy(false);
    }
  };

  const pickContacts = async () => {
    if (!contactsSupported) return;
    setBusy(true);
    setMsg(null);
    try {
      const contacts = await navigator.contacts.select(['email', 'name'], { multiple: true });
      const emails = contacts.flatMap((c) => (c.email || []).map((em) => ({ email: em, name: c.name?.[0] || '' })));
      let added = 0;
      for (const c of emails) {
        try {
          const res = await base44.functions.invoke('friends', { action: 'add', email: c.email, name: c.name });
          if (res.data?.ok) added++;
        } catch { /* skip individual failures */ }
      }
      setMsg({ type: 'ok', text: added ? `Sent ${added} friend request(s) from your contacts.` : 'No new contacts to add.' });
      await load();
      onRefresh?.();
    } catch { /* user cancelled */ } finally {
      setBusy(false);
    }
  };

  const accept = async (id) => {
    try {
      await base44.functions.invoke('friends', { action: 'accept', friendshipId: id });
      await load();
      onRefresh?.();
    } catch { /* noop */ }
  };

  const remove = async (id) => {
    try {
      await base44.functions.invoke('friends', { action: 'remove', friendshipId: id });
      await load();
      onRefresh?.();
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addEmail} className="flex gap-2">
        <Input
          type="email"
          placeholder="friend@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={busy || !email.trim()} className="flex-shrink-0">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          <span className="hidden sm:inline">Invite</span>
        </Button>
      </form>

      {contactsSupported && (
        <Button variant="outline" onClick={pickContacts} disabled={busy} className="w-full">
          <Smartphone className="h-4 w-4 mr-2" />
          Add from phone contacts
        </Button>
      )}

      {msg && (
        <p className={`text-xs ${msg.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>{msg.text}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {data.pendingReceived.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Incoming requests</p>
              <div className="space-y-1.5">
                {data.pendingReceived.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg bg-card border border-border px-3 py-2">
                    <span className="text-sm text-foreground truncate">{f.friend_name || f.friend_email}</span>
                    <div className="flex gap-1">
                      <button onClick={() => accept(f.id)} className="h-7 w-7 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center"><Check className="h-4 w-4" /></button>
                      <button onClick={() => remove(f.id)} className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.accepted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Your friends</p>
              <div className="space-y-1.5">
                {data.accepted.map((f) => {
                  const name = f.created_by_id === f.friend_user_id ? f.friend_name : (f.friend_name || f.friend_email);
                  return (
                    <div key={f.id} className="flex items-center justify-between rounded-lg bg-card border border-border px-3 py-2">
                      <span className="text-sm text-foreground truncate flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {f.friend_name || f.friend_email}
                      </span>
                      <button onClick={() => remove(f.id)} className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.pendingSent.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Pending invites</p>
              <div className="space-y-1.5">
                {data.pendingSent.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm text-muted-foreground truncate">{f.friend_email}</span>
                    <span className="text-xs text-muted-foreground">waiting…</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!data.accepted.length && !data.pendingReceived.length && !data.pendingSent.length && (
            <p className="text-xs text-muted-foreground text-center py-2">No friends yet — invite someone above!</p>
          )}
        </div>
      )}
    </div>
  );
}