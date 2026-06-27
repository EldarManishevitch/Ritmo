import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled runs (no user) and admin direct calls; block non-admin users.
    let user = null;
    try { user = await base44.auth.me(); } catch (e) { /* scheduled / no user */ }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    if (!privateKey || !publicKey) {
      return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails('mailto:admin@ritmo.app', publicKey, privateKey);

    const subs = await base44.asServiceRole.entities.PushSubscription.list('-created_date', 500);

    let sent = 0;
    let failed = 0;
    let cleaned = 0;

    for (const sub of subs) {
      let streak = 0;
      try {
        const progress = await base44.asServiceRole.entities.UserProgress.filter({ created_by_id: sub.created_by_id });
        if (progress.length) streak = progress[0].current_streak || 0;
      } catch (e) { /* ignore */ }

      const payload = JSON.stringify({
        title: streak > 0 ? `🔥 ${streak}-day streak!` : '🎵 Ritmo',
        body:
          streak > 0
            ? "Don't break your streak — play a song and keep it alive!"
            : 'A new day to learn Spanish. Play a song to continue!',
        url: '/dashboard',
      });

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        // 410 Gone / 404 → subscription expired; remove it so we don't keep retrying.
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await base44.asServiceRole.entities.PushSubscription.delete(sub.id);
            cleaned += 1;
          } catch (e) { /* ignore */ }
        }
      }
    }

    return Response.json({ sent, failed, cleaned, total: subs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});