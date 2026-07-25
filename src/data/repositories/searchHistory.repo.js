import { base44 } from '@/api/base44Client';

export const searchHistoryRepo = {
  list: (sort = '-viewed_at', limit = 6) => base44.entities.SearchHistory.list(sort, limit),
  bySong: (songId, limit = 1) => base44.entities.SearchHistory.filter({ song_id: songId }, '-viewed_at', limit),
  create: (data) => base44.entities.SearchHistory.create(data),
  update: (id, patch) => base44.entities.SearchHistory.update(id, patch),
};
