import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Weekly email nudging users toward Roleplay once they have enough saved
 * vocabulary for a conversation to actually be good (spec 3.4: "Weekly nudge
 * tied to vocabulary ... Only trigger when they have enough saved words").
 *
 * Scheduled mode (weekly cron, see function.jsonc): loops every user with
 * notifications enabled, skips anyone already nudged this week or under the
 * word threshold, and sends the rest a templated email naming their word count.
 *
 * Test mode ({ test: true }): sends to the calling admin immediately, bypassing
 * the weekly/threshold gates. Mirrors sendDailyReminders' test-mode convention.
 */

const WORD_THRESHOLD = 10;

function getWeekStart(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date.toISOString().slice(0, 10);
}

async function sendNudgeEmail(sb, email, savedCount) {
  const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://ritmo.app';
  const subject = `You've saved ${savedCount} words — ready to use them?`;
  const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #D96B43; margin-bottom: 16px;">Time to put those words to work</h2>
  <p style="font-size: 16px; color: #333; line-height: 1.5;">You've saved ${savedCount} words this month. Use them in a real conversation with your AI Roleplay partner — it's the fastest way to make new vocabulary stick.</p>
  <a href="${appUrl}/roleplay" style="display: inline-block; background: #D96B43; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Start a conversation →</a>
  <p style="font-size: 12px; color: #999; margin-top: 24px;">You're receiving this because you enabled reminders in Spanish Beats. <a href="${appUrl}/settings" style="color: #999;">Manage preferences</a></p>
</body>
</html>`;
  const textBody = `You've saved ${savedCount} words this month. Use them in a conversation: ${appUrl}/roleplay`;
  await sb.integrations.Core.SendEmail({ to: email, subject, body: htmlBody, text_body: textBody });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sb = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const isTest = body.test === true;

    if (isTest) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
      const progressList = await sb.entities.UserProgress.filter({ created_by_id: user.id });
      const progress = progressList?.[0];
      const email = progress?.user_email || user.email;
      if (!email) return Response.json({ error: 'No email on file' }, { status: 400 });
      const words = await sb.entities.SavedWord.filter({ created_by_id: user.id }, '-created_date', 500);
      await sendNudgeEmail(sb, email, words?.length || 0);
      return Response.json({ sent: 1, test: true, email });
    }

    // Scheduled mode — invoked by the native weekly automation (function.jsonc).
    // Still require admin auth on all HTTP invocations to prevent unauthenticated
    // triggering of mass email dispatch (matches sendDailyReminders enforcement).
    const schedUser = await base44.auth.me();
    if (!schedUser || schedUser.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const weekStart = getWeekStart();
    const allProgress = await sb.entities.UserProgress.filter({ notifications_enabled: true }, '-created_date', 500);

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const progress of allProgress) {
      try {
        if (progress.last_roleplay_nudge_week === weekStart) { skipped++; continue; }
        const email = progress.user_email;
        if (!email) { skipped++; continue; }

        const words = await sb.entities.SavedWord.filter({ created_by_id: progress.created_by_id }, '-created_date', 500);
        const savedCount = words?.length || 0;
        if (savedCount < WORD_THRESHOLD) { skipped++; continue; }

        await sendNudgeEmail(sb, email, savedCount);
        await sb.entities.UserProgress.update(progress.id, { last_roleplay_nudge_week: weekStart });
        sent++;
      } catch (err) {
        errors.push({ user: progress.created_by_id, error: err.message });
      }
    }

    return Response.json({ sent, skipped, total: allProgress.length, weekStart, errors: errors.slice(0, 5) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});