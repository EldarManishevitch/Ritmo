import { base44 } from '@/api/base44Client';
import { songCefrLevel } from '@/lib/cefr';

// Score percentage required to "master" a song and earn a certificate.
export const MASTERY_THRESHOLD = 80;

/**
 * Issue a certificate when a song is mastered (score >= MASTERY_THRESHOLD).
 * De-duplicates per song: keeps the best score and never creates a duplicate.
 * Returns the certificate record with an `isNew` flag, or null if not mastered.
 */
export async function issueCertificateIfMastered({ song, score, total }) {
  if (!song || !total || total <= 0) return null;
  const pct = Math.round((score / total) * 100);
  if (pct < MASTERY_THRESHOLD) return null;

  try {
    const existing = await base44.entities.Certificate.filter({ song_id: song.id });
    if (existing && existing.length) {
      const best = existing[0];
      if (pct > (best.score || 0)) {
        await base44.entities.Certificate.update(best.id, { score: pct });
        return { ...best, score: pct, isNew: false };
      }
      return { ...best, isNew: false };
    }

    const cert = await base44.entities.Certificate.create({
      song_id: song.id,
      song_title: song.title || 'Unknown',
      artist: song.artist || 'Unknown',
      score: pct,
      cefr_level: songCefrLevel(song),
      certificate_number: `RTM-${Date.now().toString(36).toUpperCase()}`,
    });
    return { ...cert, isNew: true };
  } catch {
    return null;
  }
}