import { base44 } from '@/api/base44Client';

export const certificatesRepo = {
  list: (sort = '-created_date', limit = 100) => base44.entities.Certificate.list(sort, limit),
  filter: (query) => base44.entities.Certificate.filter(query),
  create: (data) => base44.entities.Certificate.create(data),
  update: (id, patch) => base44.entities.Certificate.update(id, patch),
};
