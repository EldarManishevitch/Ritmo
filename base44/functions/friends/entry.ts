import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const svc = base44.asServiceRole;

    if (action === 'list') {
      const all = await svc.entities.Friendship.list('-created_date', 1000);
      const mine = all.filter((f) => f.created_by_id === user.id || f.friend_user_id === user.id);
      const accepted = mine.filter((f) => f.status === 'accepted');
      const pendingSent = mine.filter((f) => f.status === 'pending' && f.created_by_id === user.id);
      const pendingReceived = mine.filter((f) => f.status === 'pending' && f.friend_user_id === user.id);
      return Response.json({ accepted, pendingSent, pendingReceived });
    }

    if (action === 'add') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
      if (email === String(user.email || '').toLowerCase()) {
        return Response.json({ error: "You can't add yourself" }, { status: 400 });
      }

      // Avoid duplicate outgoing invites from this user
      const existing = await svc.entities.Friendship.filter({ friend_email: email });
      if (existing && existing.some((f) => f.created_by_id === user.id)) {
        return Response.json({ ok: true, status: 'already' });
      }

      // Look up the invitee among registered users
      const users = await svc.entities.User.list('-created_date', 1000);
      const found = users.find((u) => String(u.email || '').toLowerCase() === email);
      let friendUserId = null;
      let friendName = String(body.name || '');
      if (found) {
        friendUserId = found.id;
        friendName = found.full_name || found.email;
      } else {
        // Not registered yet — invite them so they can join the app
        try { await base44.users.inviteUser(email, 'user'); } catch (e) { /* may already be invited */ }
      }

      const rec = await base44.entities.Friendship.create({
        friend_email: email,
        friend_user_id: friendUserId,
        friend_name: friendName,
        status: 'pending',
      });
      return Response.json({ ok: true, status: found ? 'pending' : 'invited', friendship: rec });
    }

    if (action === 'accept') {
      const f = await svc.entities.Friendship.get(body.friendshipId);
      if (!f || f.friend_user_id !== user.id) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }
      const updated = await svc.entities.Friendship.update(body.friendshipId, { status: 'accepted' });
      return Response.json({ ok: true, friendship: updated });
    }

    if (action === 'remove') {
      await svc.entities.Friendship.delete(body.friendshipId);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});