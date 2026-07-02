import { base44 } from '@/api/base44Client';
import { getCachedWordTranslation, prewarmWordTranslations } from '@/lib/aiHelpers';
import { getProgress, levelForXp } from '@/lib/progress';
import { unlockedAchievementIds, newlyUnlocked } from '@/lib/achievements';
import { upsertWeeklyXP } from '@/lib/weeklyXP';

const SPANISH_STOPWORDS = new Set([
  'el','la','los','las','un','una','unos','unas','de','del','al','a','en','y','o','que','se','su','sus',
  'le','les','lo','me','te','nos','os','con','por','para','sin','es','son','fue','era','ser','estar',
  'ya','no','si','sí','mi','tu','mis','tus','pero','porque','cuando','como','más','muy','tan','todo',
  'nada','algo','hay','hace','hacer','esta','este','estos','estas','ese','esa','esos','esas','yo','él',
  'ella','ellos','ellas','nosotros','vosotros','tú','usted','mí','ti','quien','donde','cual','cómo',
  'qué','dónde','cuál','asi','así','ese','esta','entre','sobre','tras','desde','hasta','cada','otro',
  'otros','otra','otras','ese','eso','aquí','allí','hay','fue','soy','eres','somos','sois','son','estoy',
]);

export function normalizeSpanish(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function extractWords(text) {
  return (text || '')
    .split(/\s+/)
    .map((w) => w.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase())
    .filter((w) => w.length > 2 && !SPANISH_STOPWORDS.has(w));
}

export function getMostFrequentWords(lines, n) {
  const freq = {};
  (lines || []).forEach((l) => {
    extractWords(l.spanish_text).forEach((w) => {
      freq[w] = (freq[w] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Case/accent-insensitive word boundary search-and-replace with a blank. */
export function buildBlankedLine(text, word) {
  const lower = (text || '').toLowerCase();
  const target = (word || '').toLowerCase();
  const pos = lower.indexOf(target);
  if (pos < 0) return text;
  const before = pos > 0 ? text[pos - 1] : ' ';
  const after = pos + target.length < text.length ? text[pos + target.length] : ' ';
  if (/[a-záéíóúüñ]/i.test(before) || /[a-záéíóúüñ]/i.test(after)) return text;
  return text.slice(0, pos) + '_____' + text.slice(pos + target.length);
}

export function generateQuizQuestions(lines, savedWords = []) {
  if (!lines?.length) return [];
  const savedWordSet = new Set((savedWords || []).map((w) => (w.word || '').toLowerCase()));

  const allWords = new Set();
  lines.forEach((l) => extractWords(l.spanish_text).forEach((w) => allWords.add(w)));
  const wordPool = Array.from(allWords).filter((w) => w.length > 3);

  const inSaved = lines.filter((l) => extractWords(l.spanish_text).some((w) => savedWordSet.has(w)));
  const inChorus = lines.filter((l) => l.is_chorus && !inSaved.includes(l));
  const rest = lines.filter((l) => !inSaved.includes(l) && !inChorus.includes(l));

  const ordered = [...shuffle(inSaved), ...shuffle(inChorus), ...shuffle(rest)];

  const questions = [];
  for (const line of ordered) {
    if (questions.length >= 10) break;
    const wordsInLine = extractWords(line.spanish_text).filter((w) => w.length > 3);
    if (!wordsInLine.length) continue;
    const correctWord = wordsInLine[Math.floor(Math.random() * wordsInLine.length)];
    const distractors = shuffle(wordPool.filter((w) => w !== correctWord)).slice(0, 3);
    if (distractors.length < 3) continue;
    questions.push({ line, correctWord, options: shuffle([correctWord, ...distractors]) });
  }
  return questions;
}

export function levenshtein(a, b) {
  a = a || ''; b = b || '';
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export function similarity(a, b) {
  const maxLen = Math.max((a || '').length, (b || '').length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Build 6 vocab pairs: saved words first, pad with frequent lyric words (single batched AI call). */
export async function prepareVocabPairs(savedWords, lines) {
  const pairs = [];
  const usedEnglish = new Set();

  for (const sw of savedWords || []) {
    if (pairs.length >= 6) break;
    const meaning = sw.english_meaning;
    if (!meaning || usedEnglish.has(meaning.toLowerCase())) continue;
    usedEnglish.add(meaning.toLowerCase());
    pairs.push({ spanish: sw.word, english: meaning, savedWordId: sw.id });
  }

  if (pairs.length < 6) {
    const needed = 6 - pairs.length;
    const frequent = getMostFrequentWords(lines, 20);
    const missing = frequent.filter((w) => !pairs.some((p) => p.spanish === w)).slice(0, needed + 5);
    await prewarmWordTranslations(missing);
    for (const w of missing) {
      if (pairs.length >= 6) break;
      const cached = getCachedWordTranslation(w);
      const meaning = cached?.english_meaning;
      if (!meaning || usedEnglish.has(meaning.toLowerCase())) continue;
      usedEnglish.add(meaning.toLowerCase());
      pairs.push({ spanish: w, english: meaning });
    }
  }
  return pairs.slice(0, 6);
}

/** Choose 3 words to blank out from chorus lines, prioritizing high miss_count. */
export function prepareChorusBlanks(lines, flags = []) {
  const chorusLines = (lines || []).filter((l) => l.is_chorus);
  const targetLines = chorusLines.length >= 2 ? chorusLines : (lines || []).slice(0, 4);

  const missCounts = {};
  (flags || []).forEach((f) => {
    missCounts[(f.word || '').toLowerCase()] = f.miss_count || 0;
  });

  const candidates = [];
  targetLines.forEach((line) => {
    extractWords(line.spanish_text).forEach((w) => {
      if (w.length > 2) candidates.push({ word: w, missCount: missCounts[w] || 0 });
    });
  });

  candidates.sort((a, b) => {
    if (b.missCount !== a.missCount) return b.missCount - a.missCount;
    return b.word.length - a.word.length;
  });

  const chosen = [];
  const seen = new Set();
  for (const c of candidates) {
    if (chosen.length >= 3) break;
    if (seen.has(c.word)) continue;
    if (c.word.length < 5 && c.missCount === 0) continue;
    seen.add(c.word);
    chosen.push(c.word);
  }
  if (chosen.length < 3) {
    const longWords = candidates
      .filter((c) => c.word.length > 5 && !seen.has(c.word))
      .sort((a, b) => b.word.length - a.word.length);
    for (const c of longWords) {
      if (chosen.length >= 3) break;
      chosen.push(c.word);
      seen.add(c.word);
    }
  }
  while (chosen.length < 3 && candidates.length > chosen.length) {
    const next = candidates.find((c) => !seen.has(c.word));
    if (!next) break;
    chosen.push(next.word);
    seen.add(next.word);
  }

  return { targetLines, blankWords: chosen };
}

const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);

/** Award XP (+10 per quiz answer + 15 completion bonus), update songs_completed + achievements.
 *  NOTE: Streaks are now ONLY updated by DailyLesson completion — not here. */
export async function awardExerciseCompletion(quizScore = 0) {
  const p = await getProgress();
  const xpGain = quizScore * 10 + 15;
  const songsCompleted = (p.songs_completed || 0) + 1;
  const newXp = (p.xp || 0) + xpGain;

  const oldLevel = levelForXp(p.xp || 0);
  const newLevel = levelForXp(newXp);
  const leveledUp = oldLevel.cefr !== newLevel.cefr;

  const existingAchievements = Array.isArray(p.achievements) ? p.achievements : [];
  const nextProgress = { ...p, xp: newXp, songs_completed: songsCompleted };
  const unlocked = unlockedAchievementIds(nextProgress, {});
  const newOnes = newlyUnlocked(existingAchievements, unlocked);
  const achievements = Array.from(new Set([...existingAchievements, ...unlocked]));

  await base44.entities.UserProgress.update(p.id, {
    xp: newXp,
    songs_completed: songsCompleted,
    achievements,
    ...(leveledUp ? { cefr_level: newLevel.cefr } : {}),
  });

  upsertWeeklyXP(xpGain, { songCompleted: true }); // fire-and-forget

  return { ...nextProgress, achievements, newAchievements: newOnes, leveledUp, newLevel, xpGain };
}

/** Find the next song at the user's CEFR level, skipping already-completed songs. */
export async function getNextRecommendedSong(cefrLevel, currentSongId) {
  try {
    const completions = await base44.entities.SongCompletion.filter({}, '-created_date', 200);
    const completedIds = new Set((completions || []).map((c) => c.song_id).filter(Boolean));
    completedIds.add(currentSongId);

    const songs = await base44.entities.Song.filter({ cefr_level: cefrLevel }, 'created_date', 50);
    const next = (songs || []).find((s) => !completedIds.has(s.id));
    if (next) return next;

    const allSongs = await base44.entities.Song.list('-created_date', 50);
    return (allSongs || []).find((s) => !completedIds.has(s.id)) || null;
  } catch {
    return null;
  }
}