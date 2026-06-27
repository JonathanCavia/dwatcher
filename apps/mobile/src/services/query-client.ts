import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const defaultOptions = {
  queries: {
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
} as const;

let _queryClient: QueryClient | null = null;

/** Lazy singleton — returns the same QueryClient instance across the app. */
export function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = new QueryClient({ defaultOptions });
  }
  return _queryClient;
}

/** Factory — creates a fresh QueryClient instance (useful for testing). */
export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}

export { QueryClientProvider };
