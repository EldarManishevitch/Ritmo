import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { practiceFlagsRepo } = await import('./practiceFlags.repo');

describe('practiceFlagsRepo', () => {
  it('list uses defaults and forwards overrides', () => {
    practiceFlagsRepo.list();
    expect(base44.entities.PracticeFlag.list).toHaveBeenCalledWith('-created_date', 50);
    practiceFlagsRepo.list('word', 5);
    expect(base44.entities.PracticeFlag.list).toHaveBeenCalledWith('word', 5);
  });

  it('filter forwards query/sort/limit', () => {
    practiceFlagsRepo.filter({ word: 'vaina' }, 'word', 5);
    expect(base44.entities.PracticeFlag.filter).toHaveBeenCalledWith({ word: 'vaina' }, 'word', 5);
  });

  it('bySong filters by song_id only (no sort/limit)', () => {
    practiceFlagsRepo.bySong('song-1');
    expect(base44.entities.PracticeFlag.filter).toHaveBeenCalledWith({ song_id: 'song-1' });
  });

  it('create/update/delete forward their arguments', () => {
    practiceFlagsRepo.create({ word: 'vaina', miss_count: 1 });
    expect(base44.entities.PracticeFlag.create).toHaveBeenCalledWith({ word: 'vaina', miss_count: 1 });

    practiceFlagsRepo.update('f1', { miss_count: 2 });
    expect(base44.entities.PracticeFlag.update).toHaveBeenCalledWith('f1', { miss_count: 2 });

    practiceFlagsRepo.delete('f1');
    expect(base44.entities.PracticeFlag.delete).toHaveBeenCalledWith('f1');
  });
});
