import { base44 } from '@/api/base44Client';

export const weeklyXpRepo = {
  byWeek: (weekStart) => base44.entities.WeeklyXP.filter({ week_start: weekStart }),
  create: (data) => base44.entities.WeeklyXP.create(data),
  update: (id, patch) => base44.entities.WeeklyXP.update(id, patch),
};
