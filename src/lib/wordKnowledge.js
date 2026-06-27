import { base44 } from '@/api/base44Client';

// A word is "known" after the first successful try, and "mastered" after
// being answered correctly on this many DIFFERENT calendar dates.
export const MASTERY_DATE_COUNT = 21;

export const LEVEL_META = {
  new: { label: 'New', badgeClass: 'bg-muted text-muted-foreground' },
  known: { label: 'Known', badgeClass: 'bg-amber-100 text-amber-700' },
  mastered: { label: 'Mastered', badgeClass: 'bg-green-100 text-green-700' },
};

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Derive the knowledge level purely from the list of distinct success dates. */
export function levelForDates(dates) {
  const n = Array.isArray(dates) ? dates.length : 0;
  if (n >= MASTERY_DATE_COUNT) return 'mastered';
  if (n >= 1) return 'known';
  return 'new';
}

/** Best-effort level for a word record, tolerant of older records without the new fields. */
export function displayLevel(word) {
  if (word.knowledge_level) return word.knowledge_level;
  if (word.mastered) return 'mastered';
  return levelForDates(word.success_dates);
}

/** Number of distinct success dates still needed before mastery. */
export function daysToMastery(word) {
  const n = Array.isArray(word.success_dates) ? word.success_dates.length : 0;
  return Math.max(0, MASTERY_DATE_COUNT - n);
}

/**
 * Record one successful try for a saved word. Only the first success of each
 * calendar date counts toward mastery, so calling this repeatedly in one day
 * is a no-op for progress. Returns the updated word record.
 */
export async function recordWordSuccess(word) {
  const dates = Array.isArray(word.success_dates) ? word.success_dates : [];
  const today = todayStr();
  const nextDates = dates.includes(today) ? dates : [...dates, today];
  const level = levelForDates(nextDates);
  const patch = {
    success_dates: nextDates,
    knowledge_level: level,
    mastered: level === 'mastered',
  };
  await base44.entities.SavedWord.update(word.id, patch);
  return { ...word, ...patch };
}