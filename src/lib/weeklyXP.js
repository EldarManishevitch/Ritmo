import { base44 } from '@/api/base44Client';
import { getWeekStart } from '@/lib/dateHelpers';

/**
 * Upsert the current user's WeeklyXP record for this week.
 * Fire-and-forget — never blocks the caller.
 *
 * @param {number} xpAmount - XP to add
 * @param {object} opts - { lessonCompleted: bool, songCompleted: bool }
 */
export async function upsertWeeklyXP(xpAmount, opts = {}) {
  try {
    const weekStart = getWeekStart();
    const existing = await base44.entities.WeeklyXP.filter({ week_start: weekStart });
    if (existing && existing.length) {
      const rec = existing[0];
      await base44.entities.WeeklyXP.update(rec.id, {
        xp_earned: (rec.xp_earned || 0) + xpAmount,
        lessons_completed: (rec.lessons_completed || 0) + (opts.lessonCompleted ? 1 : 0),
        songs_completed: (rec.songs_completed || 0) + (opts.songCompleted ? 1 : 0),
      });
    } else {
      await base44.entities.WeeklyXP.create({
        week_start: weekStart,
        xp_earned: xpAmount,
        lessons_completed: opts.lessonCompleted ? 1 : 0,
        songs_completed: opts.songCompleted ? 1 : 0,
      });
    }
  } catch { /* fire-and-forget */ }
}

/**
 * Check if any friend has overtaken the current user this week.
 * Returns an array of { friendId, friendName, theirXp, myXp } for newly-overtaking friends.
 * Uses localStorage to avoid repeated nudges (max 2 per week).
 */
export async function checkOvertakenFriends() {
  try {
    const weekStart = getWeekStart();
    const user = await base44.auth.me();
    if (!user) return [];

    // Get my weekly XP
    const mine = await base44.entities.WeeklyXP.filter({ week_start: weekStart });
    const myXp = mine?.[0]?.xp_earned || 0;

    // Get accepted friendships
    const res = await base44.functions.invoke('friends', { action: 'list' });
    const accepted = res?.data?.accepted || [];
    const friendIds = accepted
      .map((f) => f.friend_user_id)
      .filter(Boolean);

    if (!friendIds.length) return [];

    // Load all WeeklyXP for this week, filter to friends
    const allWeekly = await base44.entities.WeeklyXP.filter({ week_start: weekStart }, '-xp_earned', 200);
    const friendEntries = (allWeekly || [])
      .filter((w) => friendIds.includes(w.created_by_id) && (w.xp_earned || 0) > myXp);

    // Check localStorage for already-notified friends
    const storageKey = 'sbOvertakenBy';
    let notified = {};
    try { notified = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { notified = {}; }

    const newOvertakes = [];
    for (const entry of friendEntries) {
      if (notified[entry.created_by_id] === weekStart) continue;
      if (Object.keys(notified).filter((k) => notified[k] === weekStart).length >= 2) break;
      const friend = accepted.find((f) => f.friend_user_id === entry.created_by_id);
      const friendName = friend?.friend_name || 'A friend';
      notified[entry.created_by_id] = weekStart;
      newOvertakes.push({ friendId: entry.created_by_id, friendName, theirXp: entry.xp_earned, myXp });
    }

    localStorage.setItem(storageKey, JSON.stringify(notified));
    return newOvertakes;
  } catch { return []; }
}