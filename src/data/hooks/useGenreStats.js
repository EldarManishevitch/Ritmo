import { useQuery } from '@tanstack/react-query';
import { genreStatsRepo } from '@/data/repositories/genreStats.repo';
import { queryKeys } from '@/data/queryKeys';

export function useGenreStatsList(sort = '-total_xp', limit = 20, options = {}) {
  return useQuery({
    queryKey: queryKeys.genreStats.list(sort, limit),
    queryFn: () => genreStatsRepo.list(sort, limit),
    ...options,
  });
}
