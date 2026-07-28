import { useQuery } from '@tanstack/react-query';
import { grammarClozeRepo } from '@/data/repositories/grammarCloze.repo';
import { queryKeys } from '@/data/queryKeys';

export function useGrammarClozeForLevel(cefrLevel, options = {}) {
  return useQuery({
    queryKey: queryKeys.grammarCloze.byLevel(cefrLevel),
    queryFn: () => grammarClozeRepo.byLevel(cefrLevel),
    enabled: !!cefrLevel,
    ...options,
  });
}
