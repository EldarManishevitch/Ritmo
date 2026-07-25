import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { songsRepo } = await import('./songs.repo');

describe('songsRepo', () => {
  it('list forwards sort/limit with defaults', () => {
    songsRepo.list();
    expect(base44.entities.Song.list).toHaveBeenCalledWith('-created_date', 50);

    songsRepo.list('title', 10);
    expect(base44.entities.Song.list).toHaveBeenCalledWith('title', 10);
  });

  it('filter forwards query/sort/limit', () => {
    const query = { cefr_level: 'A1' };
    songsRepo.filter(query, 'title', 5);
    expect(base44.entities.Song.filter).toHaveBeenCalledWith(query, 'title', 5);
  });

  it('get forwards id', () => {
    songsRepo.get('song-1');
    expect(base44.entities.Song.get).toHaveBeenCalledWith('song-1');
  });

  it('create forwards data', () => {
    const data = { title: 'Gasolina' };
    songsRepo.create(data);
    expect(base44.entities.Song.create).toHaveBeenCalledWith(data);
  });

  it('update forwards id/patch', () => {
    songsRepo.update('song-1', { genre: 'reggaeton' });
    expect(base44.entities.Song.update).toHaveBeenCalledWith('song-1', { genre: 'reggaeton' });
  });
});
