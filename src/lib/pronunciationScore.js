// Normalize a Spanish word for comparison
export function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents: á→a, é→e, etc.
    .replace(/[^a-z\s]/g, '') // strip punctuation
    .trim();
}

// Levenshtein distance between two strings
export function levenshtein(a, b) {
  a = a || ''; b = b || '';
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// Score a single spoken word against the correct word (0-100)
export function wordScore(spoken, correct) {
  const a = normalize(spoken), b = normalize(correct);
  if (!b) return 100;
  if (a === b) return 100;
  const dist = levenshtein(a, b);
  return Math.max(0, Math.round(100 - (dist / Math.max(b.length, 1)) * 100));
}

// Backward-compatible alias: scorePronunciation(correctLine, spokenTranscript) → { score }
export function scorePronunciation(correctLine, transcript) {
  const { overallScore } = scoreTranscript(transcript, correctLine);
  return { score: overallScore };
}

// Score a full transcript against a correct lyric line
// Returns { wordScores: [{word, score, matched_to}], overallScore: number }
export function scoreTranscript(transcript, correctLine) {
  const spokenWords = (transcript || '').split(/\s+/).filter(Boolean);
  const correctWords = (correctLine || '').split(/\s+/).filter(Boolean);
  const wordScores = [];
  for (let i = 0; i < correctWords.length; i++) {
    const spoken = spokenWords[i] || '';
    const correct = correctWords[i];
    const score = spoken ? wordScore(spoken, correct) : 0;
    wordScores.push({ word: correct, score, matched_to: spoken });
  }
  // Weight by word length (longer words matter more)
  const totalWeight = correctWords.reduce((s, w) => s + w.length, 0) || 1;
  const weightedSum = wordScores.reduce((s, ws, i) => s + ws.score * (correctWords[i]?.length || 1), 0);
  const overallScore = Math.round(weightedSum / totalWeight);
  return { wordScores, overallScore };
}