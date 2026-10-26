import { vi } from 'vitest';

// Create a simple, reliable Supabase mock
export const createMockSupabase = () => ({
  from: vi.fn((..._args: any[]) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then: vi.fn((resolve) => resolve({ data: null, error: null })),
      })),
      order: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          then: vi.fn((resolve) => resolve({ data: null, error: null })),
        })),
      })),
      then: vi.fn((resolve) => resolve({ data: null, error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    ),
    getSession: vi.fn(() =>
      Promise.resolve({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    ),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    admin: {
      updateUserById: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },
  },
  storage: {
    from: vi.fn(() => ({
      createSignedUrl: vi.fn(() =>
        Promise.resolve({
          data: { signedUrl: 'https://example.com/signed-url' },
          error: null,
        }),
      ),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.com/public-url' },
      })),
      upload: vi.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
      remove: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => Promise.resolve({ subscription: { subscriptionId: 'test-sub' } })),
    unsubscribe: vi.fn(),
  })),
  removeChannel: vi.fn(() => Promise.resolve()),
  functions: {
    invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  },
});

// Global mock instance
export const mockSupabase = createMockSupabase();

// Helper function to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
};
