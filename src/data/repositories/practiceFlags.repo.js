import { base44 } from '@/api/base44Client';

export const practiceFlagsRepo = {
  list: (sort = '-created_date', limit = 50) => base44.entities.PracticeFlag.list(sort, limit),
  filter: (query, sort, limit) => base44.entities.PracticeFlag.filter(query, sort, limit),
  bySong: (songId) => base44.entities.PracticeFlag.filter({ song_id: songId }),
  create: (data) => base44.entities.PracticeFlag.create(data),
  update: (id, patch) => base44.entities.PracticeFlag.update(id, patch),
  delete: (id) => base44.entities.PracticeFlag.delete(id),
};
