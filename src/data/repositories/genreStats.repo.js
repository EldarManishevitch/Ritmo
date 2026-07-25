import { base44 } from '@/api/base44Client';

export const genreStatsRepo = {
  list: (sort = '-total_xp', limit = 20) => base44.entities.GenreStats.list(sort, limit),
  byGenre: (genre) => base44.entities.GenreStats.filter({ genre }),
  create: (data) => base44.entities.GenreStats.create(data),
  update: (id, patch) => base44.entities.GenreStats.update(id, patch),
};
