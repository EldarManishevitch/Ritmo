import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsRepo } from '@/data/repositories/conversations.repo';
import { queryKeys } from '@/data/queryKeys';

export function useConversationsList(options = {}) {
  return useQuery({
    queryKey: queryKeys.conversations.list,
    queryFn: () => conversationsRepo.list(),
    ...options,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => conversationsRepo.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations.list }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => conversationsRepo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations.list }),
  });
}
