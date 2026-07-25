import { useQuery } from '@tanstack/react-query';
import { getOrCreateTodayLesson, todayStr } from '@/lib/dailyLesson';

// getOrCreateTodayLesson() is idempotent per calendar day, so it's safe to
// share across consumers as a cached query rather than each one independently
// racing to check-then-create. DailyLessonBanner.jsx and Lesson.jsx both read
// "today's lesson" — this hook lets them share one fetch/cache entry.
export function useTodayLesson(options = {}) {
  return useQuery({
    queryKey: ['dailyLesson', 'today', todayStr()],
    queryFn: () => getOrCreateTodayLesson(),
    ...options,
  });
}
