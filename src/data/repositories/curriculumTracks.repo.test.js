import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { curriculumTracksRepo } = await import('./curriculumTracks.repo');

describe('curriculumTracksRepo', () => {
  it('list uses defaults and forwards overrides', () => {
    curriculumTracksRepo.list();
    expect(base44.entities.CurriculumTrack.list).toHaveBeenCalledWith('-cefr_level', 10);
    curriculumTracksRepo.list('title', 5);
    expect(base44.entities.CurriculumTrack.list).toHaveBeenCalledWith('title', 5);
  });
});
