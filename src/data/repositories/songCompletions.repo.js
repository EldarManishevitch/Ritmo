import { base44 } from '@/api/base44Client';

export const songCompletionsRepo = {
  list: (sort = '-created_date', limit = 200) => base44.entities.SongCompletion.list(sort, limit),
  filter: (query, sort, limit) => base44.entities.SongCompletion.filter(query, sort, limit),
  create: (data) => base44.entities.SongCompletion.create(data),
};
