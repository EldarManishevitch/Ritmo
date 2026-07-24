import { useQuery } from '@tanstack/react-query';
import { songsRepo } from '@/data/repositories/songs.repo';
import { queryKeys } from '@/data/queryKeys';

export function useSongsList(sort = '-created_date', limit = 50, options = {}) {
  return useQuery({
    queryKey: queryKeys.songs.list(sort, limit),
    queryFn: () => songsRepo.list(sort, limit),
    ...options,
  });
}

export function useSongsFilter(query, sort, limit, options = {}) {
  return useQuery({
    queryKey: queryKeys.songs.filter(query),
    queryFn: () => songsRepo.filter(query, sort, limit),
    enabled: !!query,
    ...options,
  });
}

export function useSong(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.songs.detail(id),
    queryFn: () => songsRepo.get(id),
    enabled: !!id,
    ...options,
  });
}
