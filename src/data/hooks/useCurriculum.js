import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { curriculumTracksRepo } from '@/data/repositories/curriculumTracks.repo';
import { levelProgressRepo } from '@/data/repositories/levelProgress.repo';
import { queryKeys } from '@/data/queryKeys';

export function useCurriculumTracks(options = {}) {
  return useQuery({
    queryKey: queryKeys.curriculumTracks.list,
    queryFn: () => curriculumTracksRepo.list(),
    ...options,
  });
}

export function useLevelProgressList(options = {}) {
  return useQuery({
    queryKey: queryKeys.levelProgress.list,
    queryFn: () => levelProgressRepo.list(),
    ...options,
  });
}

export function useLevelProgressFor(cefrLevel, options = {}) {
  return useQuery({
    queryKey: queryKeys.levelProgress.byLevel(cefrLevel),
    queryFn: () => levelProgressRepo.byLevel(cefrLevel),
    enabled: !!cefrLevel,
    ...options,
  });
}

export function useUpdateLevelProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => levelProgressRepo.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levelProgress'] }),
  });
}
