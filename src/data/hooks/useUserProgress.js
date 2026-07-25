import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProgress } from '@/lib/progress';
import { base44 } from '@/api/base44Client';
import { queryKeys } from '@/data/queryKeys';

// Wraps the existing getProgress() from src/lib/progress.js rather than
// duplicating it as a repository — that file already owns the
// get-or-create + XP/streak business logic for UserProgress.
export function useUserProgress(options = {}) {
  return useQuery({
    queryKey: queryKeys.userProgress.current,
    queryFn: getProgress,
    ...options,
  });
}

// For simple field patches (fav_genres, notification prefs, etc.) that
// don't need the XP/streak logic in progress.js's award* functions.
// Optimistically merges the patch into the cached progress so every
// consumer (genre toggles, notification settings, passport trial, etc.)
// reflects the change instantly instead of waiting on a round trip.
export function useUpdateUserProgress() {
  const qc = useQueryClient();
  return {
    mutateAsync: async ({ id, patch }) => {
      const previous = qc.getQueryData(queryKeys.userProgress.current);
      qc.setQueryData(queryKeys.userProgress.current, (old) => (old ? { ...old, ...patch } : old));
      try {
        const result = await base44.entities.UserProgress.update(id, patch);
        qc.invalidateQueries({ queryKey: queryKeys.userProgress.current });
        return result;
      } catch (err) {
        qc.setQueryData(queryKeys.userProgress.current, previous);
        throw err;
      }
    },
  };
}
