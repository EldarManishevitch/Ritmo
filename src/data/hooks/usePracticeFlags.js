import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { practiceFlagsRepo } from '@/data/repositories/practiceFlags.repo';
import { queryKeys } from '@/data/queryKeys';

export function usePracticeFlagsList(sort = '-created_date', limit = 50, options = {}) {
  return useQuery({
    queryKey: queryKeys.practiceFlags.list(sort, limit),
    queryFn: () => practiceFlagsRepo.list(sort, limit),
    ...options,
  });
}

export function usePracticeFlagsForSong(songId, options = {}) {
  return useQuery({
    queryKey: queryKeys.practiceFlags.bySong(songId),
    queryFn: () => practiceFlagsRepo.bySong(songId),
    enabled: !!songId,
    ...options,
  });
}

// Records a miss: bumps miss_count if a flag for this word already exists,
// otherwise creates one. This exact bump-or-create pattern was duplicated
// across ChorusQuiz.jsx, QuizStep.jsx, FlashActivity.jsx, and QuizActivity.jsx.
export function useFlagWordMissed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ word, songId }) => {
      const existing = await practiceFlagsRepo.filter(songId ? { word, song_id: songId } : { word });
      if (existing?.length) {
        return practiceFlagsRepo.update(existing[0].id, { miss_count: (existing[0].miss_count || 0) + 1 });
      }
      return practiceFlagsRepo.create({ word, song_id: songId, miss_count: 1 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practiceFlags'] }),
  });
}
