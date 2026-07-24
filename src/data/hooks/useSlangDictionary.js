import { useQuery } from '@tanstack/react-query';
import { slangDictionaryRepo } from '@/data/repositories/slangDictionary.repo';
import { queryKeys } from '@/data/queryKeys';

export function useSlangTerms(options = {}) {
  return useQuery({
    queryKey: queryKeys.slangDictionary.all,
    queryFn: () => slangDictionaryRepo.all(),
    ...options,
  });
}

export function useSlangForSong(songId, options = {}) {
  return useQuery({
    queryKey: queryKeys.slangDictionary.bySong(songId),
    queryFn: () => slangDictionaryRepo.bySong(songId),
    enabled: !!songId,
    ...options,
  });
}
