import { useQuery } from '@tanstack/react-query';
import { weeklyXpRepo } from '@/data/repositories/weeklyXp.repo';
import { queryKeys } from '@/data/queryKeys';
import { getWeekStart } from '@/lib/dateHelpers';

/** The current week's WeeklyXP record (xp_earned, words_tapped, songs_completed, lessons_completed). */
export function useCurrentWeekXp(options = {}) {
  const weekStart = getWeekStart();
  return useQuery({
    queryKey: queryKeys.weeklyXp.byWeek(weekStart),
    queryFn: async () => {
      const list = await weeklyXpRepo.byWeek(weekStart);
      return list?.[0] || null;
    },
    ...options,
  });
}
