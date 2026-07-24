import { useQuery } from '@tanstack/react-query';
import { lyricLinesRepo } from '@/data/repositories/lyricLines.repo';
import { queryKeys } from '@/data/queryKeys';

export function useLyricLines(songId, options = {}) {
  return useQuery({
    queryKey: queryKeys.lyricLines.bySong(songId),
    queryFn: () => lyricLinesRepo.bySong(songId),
    enabled: !!songId,
    ...options,
  });
}
