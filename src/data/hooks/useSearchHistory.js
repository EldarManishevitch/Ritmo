import { useQuery } from '@tanstack/react-query';
import { searchHistoryRepo } from '@/data/repositories/searchHistory.repo';
import { queryKeys } from '@/data/queryKeys';

export function useSearchHistoryList(sort = '-viewed_at', limit = 6, options = {}) {
  return useQuery({
    queryKey: queryKeys.searchHistory.list(sort, limit),
    queryFn: () => searchHistoryRepo.list(sort, limit),
    ...options,
  });
}
