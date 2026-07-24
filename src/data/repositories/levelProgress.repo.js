import { base44 } from '@/api/base44Client';

export const levelProgressRepo = {
  list: (sort = '-created_date', limit = 10) => base44.entities.LevelProgress.list(sort, limit),
  byLevel: (cefrLevel) => base44.entities.LevelProgress.filter({ cefr_level: cefrLevel }),
  create: (data) => base44.entities.LevelProgress.create(data),
  update: (id, patch) => base44.entities.LevelProgress.update(id, patch),
};
