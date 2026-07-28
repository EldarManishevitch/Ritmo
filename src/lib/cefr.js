// Map legacy difficulty labels to CEFR ranks for display.
export const DIFFICULTY_TO_CEFR = {
  beginner: 'A1',
  intermediate: 'A2',
  advanced: 'B1',
  expert: 'B2',
  a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2',
};

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const songCefr = (difficulty) =>
  DIFFICULTY_TO_CEFR[(difficulty || '').toLowerCase()] || 'A2';

/** Prefer the song's explicit cefr_level field, fall back to derived difficulty. */
export const songCefrLevel = (song) =>
  song?.cefr_level || songCefr(song?.difficulty);