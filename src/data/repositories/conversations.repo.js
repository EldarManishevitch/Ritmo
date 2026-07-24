import { base44 } from '@/api/base44Client';

export const conversationsRepo = {
  list: (sort = '-updated_date', limit = 50) => base44.entities.Conversation.list(sort, limit),
  create: (data) => base44.entities.Conversation.create(data),
  update: (id, patch) => base44.entities.Conversation.update(id, patch),
  delete: (id) => base44.entities.Conversation.delete(id),
};
