import { base44 } from '@/api/base44Client';

export const lyricLinesRepo = {
  bySong: (songId, limit = 500) => base44.entities.LyricLine.filter({ song_id: songId }, 'line_index', limit),
};
