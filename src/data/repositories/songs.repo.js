import { base44 } from '@/api/base44Client';

// Thin wrapper over the Song entity. No business logic here —
// see src/lib/genres.js, src/lib/curriculum.js, etc. for that.
export const songsRepo = {
  list: (sort = '-created_date', limit = 50) => base44.entities.Song.list(sort, limit),
  filter: (query, sort, limit) => base44.entities.Song.filter(query, sort, limit),
  get: (id) => base44.entities.Song.get(id),
  create: (data) => base44.entities.Song.create(data),
  update: (id, patch) => base44.entities.Song.update(id, patch),
};
