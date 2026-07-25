import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Daily email reminder for users who haven't practiced yet today.
 *
 * Scheduled mode (hourly cron): queries UserProgress where notifications_enabled=true
 * and notifications_time matches the current hour, then sends a personalized
 * motivational email via SendEmail (powered by an InvokeLLM-generated message).
 *
 * Test mode ({ test: true }): sends a reminder to the calling user immediately,
 * bypassing the time check. Used by the admin "Send test reminder" button.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sb = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const isTest = body.test === true;

    // --- Test mode: send to the current user only ---
    if (isTest) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

      const progressList = await sb.entities.UserProgress.filter({ created_by_id: user.id });
      const progress = progressList?.[0];
      if (!progress) return Response.json({ error: 'No progress record found' }, { status: 404 });

      const email = progress.user_email || user.email;
      if (!email) return Response.json({ error: 'No email on file' }, { status: 400 });

      await sendReminderEmail(sb, progress, email);
      return Response.json({ sent: 1, test: true, email });
    }

    // --- Scheduled mode ---
    // Invoked hourly by the "Daily Reminders" scheduled workflow (platform-native,
    // no external cron or secret needed). Also callable directly by admins.
    // Uses asServiceRole for all entity/integration access — no user session required.

    const now = new Date();
    const currentHour = `${String(now.getUTCHours()).padStart(2, '0')}:00`;
    const today = now.toISOString().slice(0, 10);

    const allProgress = await sb.entities.UserProgress.filter({ notifications_enabled: true }, '-created_date', 500);

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const progress of allProgress) {
      try {
        // Check if notifications_time matches current hour
        if (!progress.notifications_time || !progress.notifications_time.startsWith(currentHour)) {
          skipped++;
          continue;
        }

        const email = progress.user_email;
        if (!email) { skipped++; continue; }

        // Check if user already practiced today — skip if they did
        const todayCompletions = await sb.entities.SongCompletion.filter({ created_by_id: progress.created_by_id }, '-created_date', 10);
        const practicedToday = (todayCompletions || []).some((c) =>
          c.completed_at && c.completed_at.slice(0, 10) === today
        );
        if (practicedToday) { skipped++; continue; }

        await sendReminderEmail(sb, progress, email);
        sent++;
      } catch (err) {
        errors.push({ user: progress.created_by_id, error: err.message });
      }
    }

    return Response.json({ sent, skipped, total: allProgress.length, hour: currentHour, errors: errors.slice(0, 5) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendReminderEmail(sb, progress, email) {
  const streak = progress.current_streak || 0;
  const ALLOWED_GENRES = ['reggaeton', 'bachata', 'pop latino', 'trap latino', 'merengue', 'salsa', 'rock latino'];
  const safeGenres = (progress.fav_genres || []).filter((g) => ALLOWED_GENRES.includes(g));
  const genres = safeGenres.join(', ') || 'reggaeton and Latin pop';

  // Generate a personalized 2-sentence motivational message
  const llmResponse = await sb.integrations.Core.InvokeLLM({
    prompt: `Write a 2-sentence motivational message in English for a Spanish learner using a music-based app. Their current streak is ${streak} days. Their favorite music genres are: ${genres}. Keep it energetic, personal, and under 40 words. Do NOT use emojis.`,
    model: 'claude_sonnet_4_6',
    response_json_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  });

  const rawMessage = llmResponse?.message || `You're on a ${streak}-day streak — keep the momentum going! Every song brings you closer to fluency.`;
  // Sanitize LLM output before interpolating into HTML — guards against
  // prompt-injection-driven HTML/XSS payloads reaching the email body.
  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const motivationalMessage = escapeHtml(rawMessage);

  const appUrl = 'https://ritmo.app';
  const subject = `🔥 Don't break your streak today — ${streak} days and counting`;

  const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #D96B43; margin-bottom: 16px;">¡Hola! Time to practice 🎵</h2>
  <p style="font-size: 16px; color: #333; line-height: 1.5;">${motivationalMessage}</p>
  <div style="background: #FFF3EE; border-radius: 12px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0; font-size: 14px; color: #888;">Your current streak</p>
    <p style="margin: 4px 0 0; font-size: 28px; font-weight: bold; color: #D96B43;">🔥 ${streak} days</p>
  </div>
  <a href="${appUrl}/dashboard" style="display: inline-block; background: #D96B43; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Start today's lesson →</a>
  <p style="font-size: 12px; color: #999; margin-top: 24px;">You're receiving this because you enabled daily reminders in Spanish Beats. <a href="${appUrl}/settings" style="color: #999;">Manage preferences</a></p>
</body>
</html>`;

  const textBody = `${rawMessage}\n\nYour current streak: ${streak} days\n\nStart today's lesson: ${appUrl}/dashboard`;

  await sb.integrations.Core.SendEmail({
    to: email,
    subject,
    body: htmlBody,
  });
}