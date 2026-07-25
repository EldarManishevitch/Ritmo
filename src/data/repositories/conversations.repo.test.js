import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { conversationsRepo } = await import('./conversations.repo');

describe('conversationsRepo', () => {
  it('list uses defaults and forwards overrides', () => {
    conversationsRepo.list();
    expect(base44.entities.Conversation.list).toHaveBeenCalledWith('-updated_date', 50);
    conversationsRepo.list('title', 5);
    expect(base44.entities.Conversation.list).toHaveBeenCalledWith('title', 5);
  });

  it('create/update/delete forward their arguments', () => {
    conversationsRepo.create({ title: 'Restaurant' });
    expect(base44.entities.Conversation.create).toHaveBeenCalledWith({ title: 'Restaurant' });

    conversationsRepo.update('c1', { messages: [] });
    expect(base44.entities.Conversation.update).toHaveBeenCalledWith('c1', { messages: [] });

    conversationsRepo.delete('c1');
    expect(base44.entities.Conversation.delete).toHaveBeenCalledWith('c1');
  });
});
