// Normalization + scoring for pronunciation karaoke.
// Strips accents/punctuation and compares word-by-word.

export function normalizeSpanish(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (á -> a)
    .replace(/[^a-zñ\s]/gi, ' ') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Returns { score (0-100), correctSet, missedSet } for word-level highlighting.
export function scorePronunciation(target, spoken) {
  const targetWords = normalizeSpanish(target).split(' ').filter(Boolean);
  const spokenWords = normalizeSpanish(spoken).split(' ').filter(Boolean);
  if (!targetWords.length) return { score: 0, correctSet: new Set(), missedSet: new Set() };

  const spokenSet = new Set(spokenWords);
  const correctSet = new Set();
  const missedSet = new Set();
  for (const w of targetWords) {
    if (spokenSet.has(w)) correctSet.add(w);
    else missedSet.add(w);
  }
  const correctCount = targetWords.filter((w) => spokenSet.has(w)).length;
  const score = Math.round((correctCount / targetWords.length) * 100);
  return { score, correctSet, missedSet };
}