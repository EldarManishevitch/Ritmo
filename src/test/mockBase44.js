import { vi } from 'vitest';

const METHODS = ['list', 'filter', 'get', 'create', 'update', 'delete', 'subscribe'];

function makeEntityMock() {
  const entity = {};
  for (const m of METHODS) entity[m] = vi.fn();
  return entity;
}

// Lazily creates a fresh vi.fn()-backed mock for any entity name accessed
// (Song, SavedWord, UserProgress, ...) so repo/hook tests don't need to
// hand-maintain a list of every entity in the schema.
export function createBase44Mock() {
  const entities = new Proxy({}, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (!(prop in target)) target[prop] = makeEntityMock();
      return target[prop];
    },
  });
  return {
    entities,
    auth: { me: vi.fn() },
    integrations: { Core: { InvokeLLM: vi.fn() } },
    functions: { invoke: vi.fn() },
  };
}
