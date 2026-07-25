import { describe, it, expect, vi } from 'vitest';
import { createBase44Mock } from '@/test/mockBase44';

vi.mock('@/api/base44Client', () => ({ base44: createBase44Mock() }));

const { base44 } = await import('@/api/base44Client');
const { roleplaySessionsRepo } = await import('./roleplaySessions.repo');

describe('roleplaySessionsRepo', () => {
  it('filter forwards query/sort/limit', () => {
    roleplaySessionsRepo.filter({ completed: false }, '-created_date', 1);
    expect(base44.entities.RoleplaySession.filter).toHaveBeenCalledWith({ completed: false }, '-created_date', 1);
  });

  it('create/update forward their arguments', () => {
    roleplaySessionsRepo.create({ scenario_title: 'Café' });
    expect(base44.entities.RoleplaySession.create).toHaveBeenCalledWith({ scenario_title: 'Café' });

    roleplaySessionsRepo.update('s1', { completed: true });
    expect(base44.entities.RoleplaySession.update).toHaveBeenCalledWith('s1', { completed: true });
  });
});
