import { base44 } from '@/api/base44Client';

export const roleplaySessionsRepo = {
  filter: (query, sort, limit) => base44.entities.RoleplaySession.filter(query, sort, limit),
  create: (data) => base44.entities.RoleplaySession.create(data),
  update: (id, patch) => base44.entities.RoleplaySession.update(id, patch),
};
