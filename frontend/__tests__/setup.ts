import { mockSupabase } from './__mocks__/supabase';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock ResizeObserver because JSDOM does not support it
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Next.js cookies API
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-cookie-value' })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock Supabase server module to bypass cookies issue
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock Sonner toast globally
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));
