import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Spaced-repetition-style reminder naming a specific due word (spec 3.4:
 * "Push/email notification only when reviews are actually due, with the specific
 * word named ... Specificity beats 'you have 4 reviews due'.")
 *
 * SavedWord has no explicit next-review-date field, so "due" is derived here:
 * not yet mastered, and either never answered correctly or not answered
 * correctly in the last 3 days (and saved at least a day ago, so brand-new
 * words aren't immediately flagged). Among due words, the most overdue one
 * (oldest last-success, or oldest save date if never succeeded) is named.
 *
 * Scheduled mode (daily cron, see function.jsonc): only emails a user once per
 * day, and only when they actually have a due word — most days this is a no-op
 * for most users, matching "only when reviews are actually due".
 *
 * Test mode ({ test: true }): sends to the calling admin immediately using
 * their most overdue word (or a generic message if they have none due).
 */

const DUE_AFTER_DAYS = 3;
const MIN_AGE_DAYS = 1;
const DAY_MS = 86400000;

function daysAgo(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / DAY_MS;
}

function mostOverdueWord(words) {
  const candidates = (words || []).filter((w) => {
    if (w.mastered || w.knowledge_level === 'mastered') return false;
    if (daysAgo(w.created_date) < MIN_AGE_DAYS) return false;
    const lastSuccess = (w.success_dates || []).slice().sort().pop();
    return daysAgo(lastSuccess) >= DUE_AFTER_DAYS;
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const aLast = (a.success_dates || []).slice().sort().pop();
    const bLast = (b.success_dates || []).slice().sort().pop();
    return daysAgo(bLast) - daysAgo(aLast) || daysAgo(b.created_date) - daysAgo(a.created_date);
  });
  return candidates[0];
}

async function sendDueEmail(sb, email, word) {
  const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://ritmo.app';
  const subject = `Do you still remember "${word.word}"?`;
  const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #D96B43; margin-bottom: 16px;">Quick review time</h2>
  <p style="font-size: 16px; color: #333; line-height: 1.5;">Do you still remember <strong>"${word.word}"</strong>? (${word.english_meaning || ''})</p>
  <p style="font-size: 14px; color: #666;">It's been a few days since you last got it right — a quick review now keeps it in long-term memory.</p>
  <a href="${appUrl}/review" style="display: inline-block; background: #D96B43; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Review now →</a>
  <p style="font-size: 12px; color: #999; margin-top: 24px;">You're receiving this because you enabled reminders in Spanish Beats. <a href="${appUrl}/settings" style="color: #999;">Manage preferences</a></p>
</body>
</html>`;
  const textBody = `Do you still remember "${word.word}" (${word.english_meaning || ''})? Review it: ${appUrl}/review`;
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
      const due = mostOverdueWord(words);
      if (!due) return Response.json({ sent: 0, test: true, reason: 'No due words' });
      await sendDueEmail(sb, email, due);
      return Response.json({ sent: 1, test: true, email, word: due.word });
    }

    // Scheduled mode — invoked by the native daily automation (function.jsonc).
    // Still require admin auth on all HTTP invocations to prevent unauthenticated
    // triggering of mass email dispatch (matches sendDailyReminders enforcement).
    const schedUser = await base44.auth.me();
    if (!schedUser || schedUser.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const allProgress = await sb.entities.UserProgress.filter({ notifications_enabled: true }, '-created_date', 500);

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const progress of allProgress) {
      try {
        if (progress.last_review_reminder_date === today) { skipped++; continue; }
        const email = progress.user_email;
        if (!email) { skipped++; continue; }

        const words = await sb.entities.SavedWord.filter({ created_by_id: progress.created_by_id }, '-created_date', 500);
        const due = mostOverdueWord(words);
        if (!due) { skipped++; continue; }

        await sendDueEmail(sb, email, due);
        await sb.entities.UserProgress.update(progress.id, { last_review_reminder_date: today });
        sent++;
      } catch (err) {
        errors.push({ user: progress.created_by_id, error: err.message });
      }
    }

    return Response.json({ sent, skipped, total: allProgress.length, today, errors: errors.slice(0, 5) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});