import { curriculumTracksRepo } from '@/data/repositories/curriculumTracks.repo';
import { levelProgressRepo } from '@/data/repositories/levelProgress.repo';
import { songCompletionsRepo } from '@/data/repositories/songCompletions.repo';
import { songsRepo } from '@/data/repositories/songs.repo';
import { isSongReady } from '@/lib/genres';

const LEVEL_META = {
  A1: { name: 'Novice', desc: 'Introduce yourself, say what you like/want, describe origin and profession, talk about near-future plans.' },
  A2: { name: 'Amigo', desc: 'Describe past events, distinguish states from identity (ser vs. estar), compare things, handle everyday transactions.' },
  B1: { name: 'Duro', desc: 'Express wishes and doubt with the subjunctive, narrate with both past tenses, use conditionals, handle most travel situations.' },
  B2: { name: 'Experto', desc: 'Argue a position, understand metaphor and social commentary, use the subjunctive across purpose/time/concession, handle hypotheticals.' },
  C1: { name: 'Maestro', desc: 'Understand slang and dialect, use the full mood/tense system for effect, read literary texts, shift register fluidly.' },
  C2: { name: 'Leyenda', desc: 'Grasp idiom, wordplay, and cultural allusion; understand philosophical and literary register; produce nuanced, stylistically controlled language.' },
};

export const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const levelMeta = (cefr) => LEVEL_META[cefr] || LEVEL_META.A1;

/** Load all curriculum tracks (one per CEFR level). */
export async function getCurriculumTracks() {
  const tracks = await curriculumTracksRepo.list('-cefr_level', 10);
  return tracks.sort((a, b) => LEVEL_ORDER.indexOf(a.cefr_level) - LEVEL_ORDER.indexOf(b.cefr_level));
}

/** Get or create the user's LevelProgress for a CEFR level. */
export async function getOrCreateLevelProgress(cefr) {
  const existing = await levelProgressRepo.byLevel(cefr);
  if (existing && existing.length) return existing[0];
  return levelProgressRepo.create({ cefr_level: cefr, songs_completed: [], certificate_issued: false });
}

/** Get all of the user's LevelProgress records. */
export async function getAllLevelProgress() {
  return levelProgressRepo.list('-created_date', 10);
}

/** Get all of the user's SongCompletion records. */
export async function getSongCompletions() {
  return songCompletionsRepo.list('-created_date', 200);
}

/**
 * Record a song exercise completion:
 * - Create SongCompletion record
 * - Add to LevelProgress.songs_completed if the song is in the track
 * - Return updated LevelProgress + whether certificate should be issued
 */
export async function completeSongExercise({ songId, quizScore, vocabScore, chorusScore, xpAwarded }) {
  await songCompletionsRepo.create({
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

  const updated = await levelProgressRepo.update(lp.id, {
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
  const trackSongs = await songsRepo.filter({ id: { $in: track.song_ids } });
  return trackSongs.find((s) => isSongReady(s) && !completedSongIds.includes(s.id)) || null;
}