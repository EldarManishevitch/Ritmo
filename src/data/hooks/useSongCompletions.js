import { useQuery } from '@tanstack/react-query';
import { songCompletionsRepo } from '@/data/repositories/songCompletions.repo';
import { queryKeys } from '@/data/queryKeys';

export function useSongCompletionsList(sort = '-created_date', limit = 200, options = {}) {
  return useQuery({
    queryKey: queryKeys.songCompletions.list(sort, limit),
    queryFn: () => songCompletionsRepo.list(sort, limit),
    ...options,
  });
}
