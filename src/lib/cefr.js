// Map legacy difficulty labels to CEFR ranks for display.
// DB stores beginner/intermediate/advanced; UI shows A1–B2.
export const DIFFICULTY_TO_CEFR = {
  beginner: 'A1',
  intermediate: 'A2',
  advanced: 'B1',
  expert: 'B2',
  a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2',
};

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'];

export const songCefr = (difficulty) =>
  DIFFICULTY_TO_CEFR[(difficulty || '').toLowerCase()] || 'A2';