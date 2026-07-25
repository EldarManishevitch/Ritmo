import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { savedWordsRepo } = await import('./savedWords.repo');

describe('savedWordsRepo', () => {
  it('list uses defaults and forwards overrides', () => {
    savedWordsRepo.list();
    expect(base44.entities.SavedWord.list).toHaveBeenCalledWith('-created_date', 200);
    savedWordsRepo.list('word', 10);
    expect(base44.entities.SavedWord.list).toHaveBeenCalledWith('word', 10);
  });

  it('filter forwards query/sort/limit', () => {
    savedWordsRepo.filter({ mastered: true }, 'word', 5);
    expect(base44.entities.SavedWord.filter).toHaveBeenCalledWith({ mastered: true }, 'word', 5);
  });

  it('bySong filters by source_song_id, newest first, with a default limit', () => {
    savedWordsRepo.bySong('song-1');
    expect(base44.entities.SavedWord.filter).toHaveBeenCalledWith({ source_song_id: 'song-1' }, '-created_date', 200);
    savedWordsRepo.bySong('song-1', 20);
    expect(base44.entities.SavedWord.filter).toHaveBeenCalledWith({ source_song_id: 'song-1' }, '-created_date', 20);
  });

  it('create/update/delete forward their arguments', () => {
    savedWordsRepo.create({ word: 'vaina' });
    expect(base44.entities.SavedWord.create).toHaveBeenCalledWith({ word: 'vaina' });

    savedWordsRepo.update('w1', { mastered: true });
    expect(base44.entities.SavedWord.update).toHaveBeenCalledWith('w1', { mastered: true });

    savedWordsRepo.delete('w1');
    expect(base44.entities.SavedWord.delete).toHaveBeenCalledWith('w1');
  });
});
