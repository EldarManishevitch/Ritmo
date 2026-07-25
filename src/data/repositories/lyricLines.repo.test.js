import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { lyricLinesRepo } = await import('./lyricLines.repo');

describe('lyricLinesRepo', () => {
  it('bySong filters by song_id, sorted by line_index, with a default limit', () => {
    lyricLinesRepo.bySong('song-1');
    expect(base44.entities.LyricLine.filter).toHaveBeenCalledWith({ song_id: 'song-1' }, 'line_index', 500);

    lyricLinesRepo.bySong('song-1', 50);
    expect(base44.entities.LyricLine.filter).toHaveBeenCalledWith({ song_id: 'song-1' }, 'line_index', 50);
  });
});
