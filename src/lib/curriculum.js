import { base44 } from '@/api/base44Client';

const LEVEL_META = {
  A1: { name: 'Novice', desc: 'Basic vocabulary, present tense, everyday phrases and greetings.' },
  A2: { name: 'Amigo', desc: 'Common expressions, past tense, simple conversations about familiar topics.' },
  B1: { name: 'Duro', desc: 'Intermediate fluency, opinions and plans, navigating everyday situations.' },
  B2: { name: 'Experto', desc: 'Advanced fluency, complex grammar, expressing nuanced ideas and emotions.' },
  C1: { name: 'Maestro', desc: 'Near-native mastery, idiomatic expressions, abstract and literary language.' },
};

export const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const levelMeta = (cefr) => LEVEL_META[cefr] || LEVEL_META.A1;

/** Load all 5 curriculum tracks. */
export async function getCurriculumTracks() {
  const tracks = await base44.entities.CurriculumTrack.list('-cefr_level', 10);
  return tracks.sort((a, b) => LEVEL_ORDER.indexOf(a.cefr_level) - LEVEL_ORDER.indexOf(b.cefr_level));
}

/** Get or create the user's LevelProgress for a CEFR level. */
export async function getOrCreateLevelProgress(cefr) {
  const existing = await base44.entities.LevelProgress.filter({ cefr_level: cefr });
  if (existing && existing.length) return existing[0];
  return base44.entities.LevelProgress.create({ cefr_level: cefr, songs_completed: [], certificate_issued: false });
}

/** Get all of the user's LevelProgress records. */
export async function getAllLevelProgress() {
  return base44.entities.LevelProgress.list('-created_date', 10);
}

/** Get all of the user's SongCompletion records. */
export async function getSongCompletions() {
  return base44.entities.SongCompletion.list('-created_date', 200);
}

/**
 * Record a song exercise completion:
 * - Create SongCompletion record
 * - Add to LevelProgress.songs_completed if the song is in the track
 * - Return updated LevelProgress + whether certificate should be issued
 */
export async function completeSongExercise({ songId, quizScore, vocabScore, chorusScore, xpAwarded }) {
  await base44.entities.SongCompletion.create({
    song_id: songId,
    quiz_score: quizScore,
    vocab_score: vocabScore,
    chorus_score: chorusScore,
    total_xp_awarded: xpAwarded,
    completed_at: new Date().toISOString(),
  });

  // Find which track this song belongs to
  const tracks = await getCurriculumTracks();
  const track = tracks.find((t) => (t.song_ids || []).includes(songId));
  if (!track) return { levelProgress: null, shouldIssueCertificate: false };

  const lp = await getOrCreateLevelProgress(track.cefr_level);
  const songsCompleted = Array.isArray(lp.songs_completed) ? lp.songs_completed : [];
  if (!songsCompleted.includes(songId)) {
    songsCompleted.push(songId);
  }
  const totalXp = (lp.total_xp_earned_at_level || 0) + xpAwarded;
  const shouldIssue = !lp.certificate_issued && songsCompleted.length >= (track.songs_needed_to_complete || 8);

  const updated = await base44.entities.LevelProgress.update(lp.id, {
    songs_completed: songsCompleted,
    total_xp_earned_at_level: totalXp,
    ...(shouldIssue ? { certificate_issued: true, certificate_issued_at: new Date().toISOString() } : {}),
  });

  return { levelProgress: updated, shouldIssueCertificate: shouldIssue, track };
}

/** Find the next incomplete song in a track for a given CEFR level. */
export async function getNextSongInTrack(cefr, completedSongIds = []) {
  const tracks = await getCurriculumTracks();
  const track = tracks.find((t) => t.cefr_level === cefr);
  if (!track || !track.song_ids?.length) return null;
  const nextId = track.song_ids.find((id) => !completedSongIds.includes(id));
  if (!nextId) return null;
  return base44.entities.Song.get(nextId);
}