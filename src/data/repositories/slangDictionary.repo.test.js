import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { slangDictionaryRepo } = await import('./slangDictionary.repo');

describe('slangDictionaryRepo', () => {
  it('all filters everything, sorted by term, with a default limit', () => {
    slangDictionaryRepo.all();
    expect(base44.entities.SlangDictionary.filter).toHaveBeenCalledWith({}, 'term', 500);
    slangDictionaryRepo.all(10);
    expect(base44.entities.SlangDictionary.filter).toHaveBeenCalledWith({}, 'term', 10);
  });

  it('filter forwards query/sort/limit', () => {
    slangDictionaryRepo.filter({ is_urban_slang: true }, '-created_date', 50);
    expect(base44.entities.SlangDictionary.filter).toHaveBeenCalledWith({ is_urban_slang: true }, '-created_date', 50);
  });

  it('bySong filters by song_id and forwards sort/limit', () => {
    slangDictionaryRepo.bySong('song-1', 'term', 20);
    expect(base44.entities.SlangDictionary.filter).toHaveBeenCalledWith({ song_id: 'song-1' }, 'term', 20);
  });
});
