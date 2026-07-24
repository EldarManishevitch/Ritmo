import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleplaySessionsRepo } from '@/data/repositories/roleplaySessions.repo';
import { queryKeys } from '@/data/queryKeys';

export function useRoleplaySessionsFilter(query, sort, limit, options = {}) {
  return useQuery({
    queryKey: queryKeys.roleplaySessions.filter(query),
    queryFn: () => roleplaySessionsRepo.filter(query, sort, limit),
    ...options,
  });
}

export function useCreateRoleplaySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => roleplaySessionsRepo.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roleplaySessions'] }),
  });
}

export function useUpdateRoleplaySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => roleplaySessionsRepo.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roleplaySessions'] }),
  });
}
