// Achievement definitions. Each `check` receives the user's progress record
// (xp, streaks, songs_completed) and an optional ctx (e.g. { perfect }).
export const ACHIEVEMENTS = [
  { id: 'first_quiz', icon: '🎯', label: 'First Steps', desc: 'Complete your first quiz', check: (p) => (p.songs_completed || 0) >= 1 },
  { id: 'songs_5', icon: '🔥', label: 'Getting Warm', desc: 'Complete 5 quizzes', check: (p) => (p.songs_completed || 0) >= 5 },
  { id: 'songs_10', icon: '🎵', label: 'Song Master', desc: 'Master 10 songs', check: (p) => (p.songs_completed || 0) >= 10 },
  { id: 'songs_25', icon: '🏆', label: 'Dedicated', desc: 'Complete 25 quizzes', check: (p) => (p.songs_completed || 0) >= 25 },
  { id: 'streak_3', icon: '⚡', label: 'On a Roll', desc: 'Reach a 3-day streak', check: (p) => (p.best_streak || 0) >= 3 },
  { id: 'streak_5', icon: '🌟', label: 'Consistent', desc: 'Reach a 5-day streak', check: (p) => (p.best_streak || 0) >= 5 },
  { id: 'streak_7', icon: '📅', label: 'Week Warrior', desc: 'Reach a 7-day streak', check: (p) => (p.best_streak || 0) >= 7 },
  { id: 'streak_30', icon: '💎', label: 'Unstoppable', desc: 'Reach a 30-day streak', check: (p) => (p.best_streak || 0) >= 30 },
  { id: 'xp_100', icon: '💯', label: 'Centurion', desc: 'Earn 100 XP', check: (p) => (p.xp || 0) >= 100 },
  { id: 'xp_500', icon: '⭐', label: 'Rising Star', desc: 'Earn 500 XP', check: (p) => (p.xp || 0) >= 500 },
  { id: 'xp_1000', icon: '👑', label: 'Maestro', desc: 'Earn 1000 XP', check: (p) => (p.xp || 0) >= 1000 },
  { id: 'perfect_quiz', icon: '✨', label: 'Flawless', desc: 'Score 100% on a quiz', check: (p, ctx) => !!ctx?.perfect },
];

// Returns the full list of achievement ids that are currently unlocked.
export function unlockedAchievementIds(progress = {}, ctx = {}) {
  return ACHIEVEMENTS.filter((a) => a.check(progress, ctx)).map((a) => a.id);
}

// Returns ids in `unlocked` that are not already in `existing`.
export function newlyUnlocked(existing = [], unlocked = []) {
  return unlocked.filter((id) => !existing.includes(id));
}

export function achievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}