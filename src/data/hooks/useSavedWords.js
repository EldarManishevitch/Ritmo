import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedWordsRepo } from '@/data/repositories/savedWords.repo';
import { queryKeys } from '@/data/queryKeys';

export function useSavedWordsList(sort = '-created_date', limit = 200, options = {}) {
  return useQuery({
    queryKey: queryKeys.savedWords.list(sort, limit),
    queryFn: () => savedWordsRepo.list(sort, limit),
    ...options,
  });
}

export function useSavedWordsFilter(query, sort, limit, options = {}) {
  return useQuery({
    queryKey: queryKeys.savedWords.filter(query),
    queryFn: () => savedWordsRepo.filter(query, sort, limit),
    ...options,
  });
}

export function useSavedWordsForSong(songId, options = {}) {
  return useQuery({
    queryKey: queryKeys.savedWords.bySong(songId),
    queryFn: () => savedWordsRepo.bySong(songId),
    enabled: !!songId,
    ...options,
  });
}

// Invalidates every savedWords query on success — simpler and safer than
// hand-picking keys, and saved-word lists are small enough this is cheap.
export function useSaveWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => savedWordsRepo.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savedWords'] }),
  });
}

export function useUpdateSavedWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => savedWordsRepo.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savedWords'] }),
  });
}

export function useDeleteSavedWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => savedWordsRepo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savedWords'] }),
  });
}
