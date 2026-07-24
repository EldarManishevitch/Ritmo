import { useMemo } from 'react';
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

// term (lowercased) -> song_id, for guides that link static term lists to
// catalog songs. Previously duplicated verbatim in DominicanSlangGuide.jsx
// and ReggaetonSlangGuide.jsx.
export function useSlangSongIdMap() {
  const { data, ...rest } = useSlangTerms();
  const map = useMemo(() => {
    const m = {};
    (data || []).forEach((s) => {
      if (s.song_id) m[s.term?.toLowerCase()] = s.song_id;
    });
    return m;
  }, [data]);
  return { map, ...rest };
}
