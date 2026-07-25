import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { certificatesRepo } = await import('./certificates.repo');

describe('certificatesRepo', () => {
  it('list uses defaults and forwards overrides', () => {
    certificatesRepo.list();
    expect(base44.entities.Certificate.list).toHaveBeenCalledWith('-created_date', 100);
    certificatesRepo.list('score', 10);
    expect(base44.entities.Certificate.list).toHaveBeenCalledWith('score', 10);
  });

  it('filter forwards only the query (no sort/limit)', () => {
    certificatesRepo.filter({ song_id: 'song-1' });
    expect(base44.entities.Certificate.filter).toHaveBeenCalledWith({ song_id: 'song-1' });
  });

  it('create/update forward their arguments', () => {
    certificatesRepo.create({ song_id: 'song-1', score: 90 });
    expect(base44.entities.Certificate.create).toHaveBeenCalledWith({ song_id: 'song-1', score: 90 });

    certificatesRepo.update('c1', { score: 95 });
    expect(base44.entities.Certificate.update).toHaveBeenCalledWith('c1', { score: 95 });
  });
});
