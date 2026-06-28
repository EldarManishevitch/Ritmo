import { base44 } from '@/api/base44Client';
import { unlockedAchievementIds, newlyUnlocked } from '@/lib/achievements';

export const LEVELS = [
  { xp: 1000, cefr: 'B2', title: 'Maestro' },
  { xp: 500, cefr: 'B1', title: 'Duro' },
  { xp: 200, cefr: 'A2', title: 'Amigo' },
  { xp: 0, cefr: 'A1', title: 'Novice' },
];

export function levelForXp(xp = 0) {
  return LEVELS.find((l) => xp >= l.xp) || LEVELS[LEVELS.length - 1];
}

const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);

export async function getProgress() {
  const list = await base44.entities.UserProgress.filter({});
  if (list && list.length) return list[0];
  return base44.entities.UserProgress.create({
    xp: 0,
    current_streak: 0,
    best_streak: 0,
    last_activity_date: '',
    songs_completed: 0,
    achievements: [],
  });
}

// Award XP + update streak + count the song + unlock achievements.
// Call ONLY after a full quiz is completed. `score` = correct count, `total` = question count.
export async function awardQuizCompletion(score = 0, total = 0) {
  const p = await getProgress();
  const today = dayStr();
  const xpGain = Math.max(score, 0) * 10;
  const perfect = total > 0 && score === total;

  let current = p.current_streak || 0;
  if (p.last_activity_date !== today) {
    const yesterday = dayStr(new Date(Date.now() - 86400000));
    current = p.last_activity_date === yesterday ? current + 1 : 1;
  }
  const best = Math.max(p.best_streak || 0, current);
  const songsCompleted = (p.songs_completed || 0) + 1;
  const newXp = (p.xp || 0) + xpGain;

  const nextProgress = {
    ...p,
    xp: newXp,
    current_streak: current,
    best_streak: best,
    songs_completed: songsCompleted,
  };

  const existingAchievements = Array.isArray(p.achievements) ? p.achievements : [];
  const unlocked = unlockedAchievementIds(nextProgress, { perfect });
  const newOnes = newlyUnlocked(existingAchievements, unlocked);
  const achievements = Array.from(new Set([...existingAchievements, ...unlocked]));

  await base44.entities.UserProgress.update(p.id, {
    xp: newXp,
    current_streak: current,
    best_streak: best,
    last_activity_date: today,
    songs_completed: songsCompleted,
    achievements,
  });

  return { ...nextProgress, achievements, newAchievements: newOnes };
}

// Award a flat XP amount (no streak change). Persists a CEFR level-up and
// returns { leveledUp, newLevel } so callers can show a celebration.
async function awardXp(amount) {
  const p = await getProgress();
  const oldXp = p.xp || 0;
  const newXp = oldXp + amount;
  const before = levelForXp(oldXp);
  const after = levelForXp(newXp);
  const leveledUp = before.cefr !== after.cefr;
  await base44.entities.UserProgress.update(p.id, {
    xp: newXp,
    ...(leveledUp ? { cefr_level: after.cefr } : {}),
  });
  return { ...p, xp: newXp, leveledUp, newLevel: after };
}

// Award XP for mastering a word (+25). Does NOT update streak.
export const awardWordMastered = () => awardXp(25);

// Award XP for completing a roleplay (+50). Does NOT update streak.
export const awardRoleplayCompletion = () => awardXp(50);

// Award XP for completing a song section (+15). Does NOT update streak.
export const awardSectionCompletion = () => awardXp(15);