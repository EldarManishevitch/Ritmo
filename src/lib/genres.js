import { base44 } from '@/api/base44Client';

export const GENRES = ['reggaeton', 'bachata', 'pop latino', 'trap latino', 'salsa', 'merengue', 'rock latino'];

export const PICKER_GENRES = ['reggaeton', 'bachata', 'salsa', 'pop latino', 'trap latino'];

export const GENRE_COLORS = {
  reggaeton: { bg: 'bg-orange-100', text: 'text-orange-700', solid: 'bg-orange-500', border: 'border-orange-300', hex: '#f97316' },
  bachata: { bg: 'bg-purple-100', text: 'text-purple-700', solid: 'bg-purple-500', border: 'border-purple-300', hex: '#a855f7' },
  salsa: { bg: 'bg-green-100', text: 'text-green-700', solid: 'bg-green-500', border: 'border-green-300', hex: '#22c55e' },
  'pop latino': { bg: 'bg-blue-100', text: 'text-blue-700', solid: 'bg-blue-500', border: 'border-blue-300', hex: '#3b82f6' },
  'trap latino': { bg: 'bg-amber-100', text: 'text-amber-700', solid: 'bg-amber-500', border: 'border-amber-300', hex: '#f59e0b' },
  merengue: { bg: 'bg-pink-100', text: 'text-pink-700', solid: 'bg-pink-500', border: 'border-pink-300', hex: '#ec4899' },
  'rock latino': { bg: 'bg-red-100', text: 'text-red-700', solid: 'bg-red-500', border: 'border-red-300', hex: '#ef4444' },
};

export const GENRE_LABELS = {
  reggaeton: 'Reggaeton',
  bachata: 'Bachata',
  salsa: 'Salsa',
  'pop latino': 'Pop Latino',
  'trap latino': 'Trap Latino',
  merengue: 'Merengue',
  'rock latino': 'Rock Latino',
};

// Artist → genre map for slang selection and genre inference
export const ARTIST_GENRE_MAP = {
  'bad bunny': 'reggaeton',
  'j balvin': 'reggaeton',
  'daddy yankee': 'reggaeton',
  'nicky jam': 'reggaeton',
  'ozuna': 'reggaeton',
  'karol g': 'reggaeton',
  'maluma': 'reggaeton',
  'rauw alejandro': 'reggaeton',
  'romeo santos': 'bachata',
  'aventura': 'bachata',
  'prince royce': 'bachata',
  'marc anthony': 'salsa',
  'gente de zona': 'salsa',
  'shakira': 'pop latino',
  'enrique iglesias': 'pop latino',
};

export function artistToGenre(artist) {
  if (!artist) return null;
  const lower = artist.toLowerCase();
  for (const [a, g] of Object.entries(ARTIST_GENRE_MAP)) {
    if (lower.includes(a)) return g;
  }
  return null;
}

export function genreColor(genre) {
  return GENRE_COLORS[genre] || { bg: 'bg-gray-100', text: 'text-gray-700', solid: 'bg-gray-500', border: 'border-gray-300', hex: '#6b7280' };
}

export function genreLabel(genre) {
  return GENRE_LABELS[genre] || (genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : 'Unknown');
}

export const READY_STATUSES = ['ready', 'ready_synced', 'ready_unsynced', 'static'];

export function isSongReady(song) {
  return READY_STATUSES.includes(song?.sync_status);
}

const dayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Upsert GenreStats when a song exercise is completed.
 * Looks up the song's genre and increments songs_completed + total_xp.
 */
export async function upsertGenreStatsOnCompletion({ songId, xpAwarded = 0 }) {
  try {
    const song = await base44.entities.Song.get(songId);
    if (!song?.genre) return;
    const existing = await base44.entities.GenreStats.filter({ genre: song.genre });
    const today = dayStr();
    if (existing?.length) {
      const rec = existing[0];
      await base44.entities.GenreStats.update(rec.id, {
        songs_completed: (rec.songs_completed || 0) + 1,
        total_xp: (rec.total_xp || 0) + xpAwarded,
        last_practiced: today,
      });
    } else {
      await base44.entities.GenreStats.create({
        genre: song.genre,
        songs_completed: 1,
        total_xp: xpAwarded,
        last_practiced: today,
      });
    }
  } catch { /* noop */ }
}

/**
 * Upsert GenreStats when a word is saved.
 * Looks up the source song's genre and increments words_saved.
 */
export async function upsertGenreStatsOnWordSaved({ sourceSongId }) {
  if (!sourceSongId) return;
  try {
    const song = await base44.entities.Song.get(sourceSongId);
    if (!song?.genre) return;
    const existing = await base44.entities.GenreStats.filter({ genre: song.genre });
    const today = dayStr();
    if (existing?.length) {
      const rec = existing[0];
      await base44.entities.GenreStats.update(rec.id, {
        words_saved: (rec.words_saved || 0) + 1,
        last_practiced: today,
      });
    } else {
      await base44.entities.GenreStats.create({
        genre: song.genre,
        words_saved: 1,
        last_practiced: today,
      });
    }
  } catch { /* noop */ }
}