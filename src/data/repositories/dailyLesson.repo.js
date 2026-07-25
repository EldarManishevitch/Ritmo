import { base44 } from '@/api/base44Client';

export const dailyLessonRepo = {
  byDate: (lessonDate) => base44.entities.DailyLesson.filter({ lesson_date: lessonDate }),
  create: (data) => base44.entities.DailyLesson.create(data),
  update: (id, patch) => base44.entities.DailyLesson.update(id, patch),
};
