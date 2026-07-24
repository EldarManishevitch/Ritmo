import { base44 } from '@/api/base44Client';

export const savedWordsRepo = {
  list: (sort = '-created_date', limit = 200) => base44.entities.SavedWord.list(sort, limit),
  filter: (query, sort, limit) => base44.entities.SavedWord.filter(query, sort, limit),
  bySong: (songId, limit = 200) => base44.entities.SavedWord.filter({ source_song_id: songId }, '-created_date', limit),
  create: (data) => base44.entities.SavedWord.create(data),
  update: (id, patch) => base44.entities.SavedWord.update(id, patch),
  delete: (id) => base44.entities.SavedWord.delete(id),
};
