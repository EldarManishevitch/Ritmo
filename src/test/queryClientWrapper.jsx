import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Fresh, isolated QueryClient per test: no retries (so failures surface
// immediately instead of hanging on backoff) and no cache reuse across tests.
export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  function wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper, queryClient };
}
