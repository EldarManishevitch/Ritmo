import { base44 } from '@/api/base44Client';
import { getWeekStart } from '@/lib/dateHelpers';

/**
 * Fire-and-forget upsert of the current user's WeeklyXP record for this week.
 * Call WITHOUT await wherever UserProgress.xp is incremented.
 *
 * @param {object} args
 * @param {number} args.amount - XP to add (same amount added to UserProgress.xp)
 * @param {'xp'|'lesson'|'song'} [args.source] - what earned the XP:
 *   'lesson' also increments lessons_completed, 'song' also increments songs_completed.
 */
export async function upsertWeeklyXp({ amount, source = 'xp' }) {
  if (!amount) return;
  try {
    const weekStart = getWeekStart();
    const existing = await base44.entities.WeeklyXP.filter({ week_start: weekStart });
    if (existing && existing.length) {
      const rec = existing[0];
      await base44.entities.WeeklyXP.update(rec.id, {
        xp_earned: (rec.xp_earned || 0) + amount,
        lessons_completed: (rec.lessons_completed || 0) + (source === 'lesson' ? 1 : 0),
        songs_completed: (rec.songs_completed || 0) + (source === 'song' ? 1 : 0),
      });
    } else {
      await base44.entities.WeeklyXP.create({
        week_start: weekStart,
        xp_earned: amount,
        lessons_completed: source === 'lesson' ? 1 : 0,
        songs_completed: source === 'song' ? 1 : 0,
      });
    }
  } catch { /* fire-and-forget */ }
}