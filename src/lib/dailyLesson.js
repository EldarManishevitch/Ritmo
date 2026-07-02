import { base44 } from '@/api/base44Client';
import { getProgress } from '@/lib/progress';
import { getCurriculumTracks, getSongCompletions } from '@/lib/curriculum';
import { upsertWeeklyXp } from '@/lib/weeklyXp';

const READY_STATUSES = ['ready', 'ready_synced', 'ready_unsynced', 'static'];

export function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function hashIndex(str, mod) {
  if (mod <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
  return sum % mod;
}

/**
 * Get today's DailyLesson for the current user, creating it if it doesn't exist.
 * Song selection priority:
 *  1. Next uncompleted song in CurriculumTrack at user's cefr_level WHERE genre IN fav_genres
 *  2. Next uncompleted song in CurriculumTrack at user's cefr_level (any genre)
 *  3. Random ready Song at level, genre IN fav_genres, not completed
 *  4. Random ready Song at level, not completed
 *  5. Any random ready Song at level
 * Deterministic seed: hash(userId + lessonDate) % eligible.length.
 * Returns the lesson record (with _lines attached for immediate use), or null.
 */
export async function getOrCreateTodayLesson() {
  const today = todayStr();
  const existing = await base44.entities.DailyLesson.filter({ lesson_date: today });
  if (existing && existing.length) {
    const lesson = existing[0];
    // Attach the chorus lines for the UI
    const lines = await loadLessonLines(lesson);
    return { ...lesson, _lines: lines };
  }

  const user = await base44.auth.me();
  const userId = user?.id || 'anon';
  const seed = userId + today;

  const [progress, completions, tracks, allSongs] = await Promise.all([
    getProgress(),
    getSongCompletions(),
    getCurriculumTracks(),
    base44.entities.Song.list('-created_date', 300),
  ]);
  const cefr = progress?.cefr_level || 'A1';
  const favGenres = Array.isArray(progress?.fav_genres) ? progress.fav_genres : [];
  const completedIds = new Set((completions || []).map((c) => c.song_id).filter(Boolean));
  const ready = (allSongs || []).filter((s) => READY_STATUSES.includes(s.sync_status));

  let selected = null;

  const track = tracks.find((t) => t.cefr_level === cefr);
  if (track) {
    const trackSongs = (track.song_ids || [])
      .map((id) => ready.find((s) => s.id === id))
      .filter(Boolean);
    const p1 = trackSongs.filter((s) => !completedIds.has(s.id) && favGenres.includes(s.genre));
    if (p1.length) selected = p1[hashIndex(seed, p1.length)];
    if (!selected) {
      const p2 = trackSongs.filter((s) => !completedIds.has(s.id));
      if (p2.length) selected = p2[hashIndex(seed, p2.length)];
    }
  }
  if (!selected) {
    const p3 = ready.filter((s) => s.cefr_level === cefr && !completedIds.has(s.id) && favGenres.includes(s.genre));
    if (p3.length) selected = p3[hashIndex(seed, p3.length)];
  }
  if (!selected) {
    const p4 = ready.filter((s) => s.cefr_level === cefr && !completedIds.has(s.id));
    if (p4.length) selected = p4[hashIndex(seed, p4.length)];
  }
  if (!selected) {
    const p5 = ready.filter((s) => s.cefr_level === cefr);
    if (p5.length) selected = p5[hashIndex(seed, p5.length)];
  }
  if (!selected && ready.length) selected = ready[hashIndex(seed, ready.length)];
  if (!selected) return null;

  const chosenLines = await pickChorusLines(selected.id);

  const lesson = await base44.entities.DailyLesson.create({
    lesson_date: today,
    song_id: selected.id,
    song_title: selected.title,
    song_artist: selected.artist,
    song_youtube_id: selected.youtube_id,
    song_genre: selected.genre,
    chorus_line_ids: chosenLines.map((l) => l.id),
    completed: false,
    activity_step: 1,
    quiz_score: 0,
    words_tapped: [],
    streak_awarded: false,
  });
  return { ...lesson, _lines: chosenLines };
}

async function loadLessonLines(lesson) {
  if (!lesson?.chorus_line_ids?.length) return [];
  const lines = await base44.entities.LyricLine.filter({ song_id: lesson.song_id }, 'line_index', 300);
  const byId = new Map((lines || []).map((l) => [l.id, l]));
  return lesson.chorus_line_ids.map((id) => byId.get(id)).filter(Boolean);
}

async function pickChorusLines(songId) {
  const lines = await base44.entities.LyricLine.filter({ song_id: songId }, 'line_index', 300);
  const chorus = (lines || []).filter((l) => l.is_chorus).slice(0, 5);
  const nonChorus = (lines || []).filter((l) => !l.is_chorus);
  const chosen = [...chorus];
  for (const l of nonChorus) {
    if (chosen.length >= 5) break;
    if (!chosen.find((c) => c.id === l.id)) chosen.push(l);
  }
  return chosen.slice(0, 5);
}

export function getMilestone(streak) {
  if (streak === 100) return '100 days! 👑';
  if (streak === 30) return 'One month! 🏆';
  if (streak === 7) return 'One week! 🗓️';
  return null;
}

/**
 * Mark today's lesson complete and award the streak (idempotent via streak_awarded).
 * Returns { newStreak, xpGain, milestone, alreadyCompleted }.
 */
export async function completeTodayLesson({ quizScore, wordsTapped }) {
  const today = todayStr();
  const lessons = await base44.entities.DailyLesson.filter({ lesson_date: today });
  const lesson = lessons?.[0];
  if (!lesson) return null;

  const xpGain = (quizScore || 0) * 10 + 15;

  if (lesson.streak_awarded) {
    await base44.entities.DailyLesson.update(lesson.id, {
      completed: true,
      completed_at: new Date().toISOString(),
      quiz_score: quizScore,
      words_tapped: wordsTapped || [],
    });
    return { alreadyCompleted: true, xpGain };
  }

  const progress = await getProgress();
  const yesterday = todayStr(new Date(Date.now() - 86400000));
  let newStreak;
  if (progress.last_activity_date === today) {
    newStreak = progress.current_streak || 1;
  } else if (progress.last_activity_date === yesterday) {
    newStreak = (progress.current_streak || 0) + 1;
  } else {
    newStreak = 1;
  }
  const newXp = (progress.xp || 0) + xpGain;

  await base44.entities.UserProgress.update(progress.id, {
    current_streak: newStreak,
    best_streak: Math.max(progress.best_streak || 0, newStreak),
    last_activity_date: today,
    xp: newXp,
  });
  upsertWeeklyXp({ amount: xpGain, source: 'lesson' });
  await base44.entities.DailyLesson.update(lesson.id, {
    completed: true,
    completed_at: new Date().toISOString(),
    quiz_score: quizScore,
    words_tapped: wordsTapped || [],
    streak_awarded: true,
  });

  // GenreStats upsert (entity created as part of the genre-cohorts feature)
  try {
    const existing = await base44.entities.GenreStats.filter({ genre: lesson.song_genre });
    if (existing?.length) {
      const gs = existing[0];
      await base44.entities.GenreStats.update(gs.id, {
        songs_completed: (gs.songs_completed || 0) + 1,
        total_xp: (gs.total_xp || 0) + xpGain,
        last_practiced: today,
      });
    } else {
      await base44.entities.GenreStats.create({
        genre: lesson.song_genre,
        songs_completed: 1,
        total_xp: xpGain,
        last_practiced: today,
      });
    }
  } catch { /* GenreStats entity may not exist yet */ }

  return { newStreak, xpGain, milestone: getMilestone(newStreak) };
}

export async function updateLessonStep(step, extra = {}) {
  const today = todayStr();
  const lessons = await base44.entities.DailyLesson.filter({ lesson_date: today });
  if (!lessons?.length) return;
  await base44.entities.DailyLesson.update(lessons[0].id, { activity_step: step, ...extra });
}

export async function addTappedWord(word) {
  const today = todayStr();
  const lessons = await base44.entities.DailyLesson.filter({ lesson_date: today });
  if (!lessons?.length) return;
  const lesson = lessons[0];
  const words = Array.isArray(lesson.words_tapped) ? lesson.words_tapped : [];
  if (words.includes(word)) return;
  await base44.entities.DailyLesson.update(lesson.id, { words_tapped: [...words, word] });
}