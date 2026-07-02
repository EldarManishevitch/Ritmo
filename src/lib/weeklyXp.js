import { base44 } from '@/api/base44Client';
import { getWeekStart } from '@/lib/dateHelpers';

/**
 * Fire-and-forget: upsert weekly XP for the current user.
 * @param {number} amount - XP to add
 * @param {string} source - 'xp' | 'lesson' | 'song'
 */
export async function upsertWeeklyXp({ amount, source = 'xp' }) {
  if (!amount) return;
  try {
    const weekStart = getWeekStart();
    const existing = await base44.entities.WeeklyXP.filter({ week_start: weekStart });
    if (existing?.length) {
      const rec = existing[0];
      const updates = { xp_earned: (rec.xp_earned || 0) + amount };
      if (source === 'lesson') updates.lessons_completed = (rec.lessons_completed || 0) + 1;
      if (source === 'song') updates.songs_completed = (rec.songs_completed || 0) + 1;
      await base44.entities.WeeklyXP.update(rec.id, updates);
    } else {
      await base44.entities.WeeklyXP.create({
        week_start: weekStart,
        xp_earned: amount,
        lessons_completed: source === 'lesson' ? 1 : 0,
        songs_completed: source === 'song' ? 1 : 0,
      });
    }
    checkOvertaken();
  } catch { /* noop */ }
}

/**
 * Check if any friend has surpassed the user this week.
 * Stores a nudge in localStorage for the Dashboard banner to pick up.
 */
async function checkOvertaken() {
  try {
    const weekStart = getWeekStart();
    const me = await base44.auth.me();
    if (!me) return;

    const friendsRes = await base44.functions.invoke('friends', { action: 'list' });
    const accepted = friendsRes?.data?.accepted || [];
    const friendIds = accepted
      .map((f) => (f.friend_user_id === f.created_by_id ? null : (f.friend_user_id || f.created_by_id)))
      .filter(Boolean);

    if (!friendIds.length) return;

    const allWeekly = await base44.entities.WeeklyXP.filter({ week_start: weekStart });
    const mine = allWeekly?.find((w) => w.created_by_id === me.id);
    if (!mine) return;

    const friendsHigher = allWeekly.filter(
      (w) => friendIds.includes(w.created_by_id) && (w.xp_earned || 0) > (mine.xp_earned || 0)
    );
    if (!friendsHigher.length) return;

    const overtaken = JSON.parse(localStorage.getItem('sbOvertakenBy') || '{}');
    if (Object.keys(overtaken).length >= 2) return;

    for (const f of friendsHigher) {
      if (overtaken[f.created_by_id] === weekStart) continue;
      overtaken[f.created_by_id] = weekStart;
      const friend = accepted.find(
        (a) => a.friend_user_id === f.created_by_id || a.created_by_id === f.created_by_id
      );
      localStorage.setItem('sbOvertakenData', JSON.stringify({
        friendName: friend?.friend_name || 'A friend',
        theirXp: f.xp_earned || 0,
        myXp: mine.xp_earned || 0,
        weekStart,
      }));
      localStorage.setItem('sbOvertakenBy', JSON.stringify(overtaken));
      break;
    }
  } catch { /* noop */ }
}