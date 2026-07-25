import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { levelProgressRepo } = await import('./levelProgress.repo');

describe('levelProgressRepo', () => {
  it('list uses defaults and forwards overrides', () => {
    levelProgressRepo.list();
    expect(base44.entities.LevelProgress.list).toHaveBeenCalledWith('-created_date', 10);
    levelProgressRepo.list('cefr_level', 3);
    expect(base44.entities.LevelProgress.list).toHaveBeenCalledWith('cefr_level', 3);
  });

  it('byLevel filters by cefr_level', () => {
    levelProgressRepo.byLevel('B1');
    expect(base44.entities.LevelProgress.filter).toHaveBeenCalledWith({ cefr_level: 'B1' });
  });

  it('create/update forward their arguments', () => {
    levelProgressRepo.create({ cefr_level: 'A1', songs_completed: [] });
    expect(base44.entities.LevelProgress.create).toHaveBeenCalledWith({ cefr_level: 'A1', songs_completed: [] });

    levelProgressRepo.update('lp1', { certificate_issued: true });
    expect(base44.entities.LevelProgress.update).toHaveBeenCalledWith('lp1', { certificate_issued: true });
  });
});
