import { UploadProvider } from '@/components/providers/upload-provider';
import { useUploads } from '@/lib/context/upload-context';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase to prevent actual network calls
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockRejectedValue(new Error('Not authenticated')),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockRejectedValue(new Error('Upload failed')),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('No profile'),
          }),
        }),
      }),
      insert: vi.fn().mockRejectedValue(new Error('Insert failed')),
    }),
  }),
}));

// Mock notifications
vi.mock('@/lib/actions/notifications', () => ({
  notifyStudentsForResource: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth-context to prevent useAuth error in UploadProvider
vi.mock('@/lib/context/auth-context', () => ({
  useAuth: () => ({
    session: { access_token: 'mock-access-token' },
    user: { id: 'teacher-123', email: 'teacher@example.com' },
    loading: false,
  }),
}));

// Mock crypto.randomUUID with unique values
let uuidCounter = 0;
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn().mockImplementation(() => `test-uuid-${++uuidCounter}`),
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UploadProvider>{children}</UploadProvider>
);

describe('useUploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;
  });

  it('should throw error when used outside UploadProvider', () => {
    expect(() => {
      renderHook(() => useUploads());
    }).toThrow('useUploads must be used within an UploadProvider');
  });

  it('should return initial empty state', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    expect(result.current.uploads).toEqual([]);
    expect(typeof result.current.addUpload).toBe('function');
    expect(typeof result.current.removeUpload).toBe('function');
    expect(typeof result.current.dismissCompleted).toBe('function');
    expect(typeof result.current.cancelUpload).toBe('function');
  });

  it('should add upload task', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    const mockTask = {
      file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      title: 'Test Document',
      subjectId: '1',
      grade: '10',
      type: 'textbook',
    };

    act(() => {
      result.current.addUpload(mockTask);
    });

    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.uploads[0]).toMatchObject({
      id: 'test-uuid-1',
      ...mockTask,
      progress: expect.any(Number),
      status: expect.any(String), // Status changes from 'pending' to 'uploading' due to useEffect
      timestamp: expect.any(Number),
    });
  });

  it('should remove upload task', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    const mockTask = {
      file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      title: 'Test Document',
      subjectId: '1',
      grade: '10',
      type: 'textbook',
    };

    act(() => {
      result.current.addUpload(mockTask);
    });

    const uploadId = result.current.uploads[0].id;

    act(() => {
      result.current.removeUpload(uploadId);
    });

    expect(result.current.uploads).toHaveLength(0);
  });

  it('should cancel upload task', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    const mockTask = {
      file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      title: 'Test Document',
      subjectId: '1',
      grade: '10',
      type: 'textbook',
    };

    act(() => {
      result.current.addUpload(mockTask);
    });

    const uploadId = result.current.uploads[0].id;

    act(() => {
      result.current.cancelUpload(uploadId);
    });

    expect(result.current.uploads[0].status).toBe('canceled');
    expect(result.current.uploads[0].error).toBeUndefined();
  });

  it('should dismiss completed uploads', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    const mockTask = {
      file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      title: 'Test Document',
      subjectId: '1',
      grade: '10',
      type: 'textbook',
    };

    // Add multiple uploads
    act(() => {
      result.current.addUpload(mockTask);
      result.current.addUpload({ ...mockTask, title: 'Test 2' });
      result.current.addUpload({ ...mockTask, title: 'Test 3' });
    });

    // Manually set some statuses to completed/error for testing
    act(() => {
      result.current.uploads[0].status = 'completed';
      result.current.uploads[1].status = 'error';
      // Keep third one as uploading (it will be 'uploading' due to useEffect)
    });

    act(() => {
      result.current.dismissCompleted();
    });

    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.uploads[0].status).not.toBe('completed');
    expect(result.current.uploads[0].status).not.toBe('error');
  });

  it('should handle multiple uploads correctly', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    const mockTasks = [
      {
        file: new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
        title: 'Document 1',
        subjectId: '1',
        grade: '10',
        type: 'textbook',
      },
      {
        file: new File(['test2'], 'test2.pdf', { type: 'application/pdf' }),
        title: 'Document 2',
        subjectId: '2',
        grade: '11',
        type: 'worksheet',
      },
    ];

    act(() => {
      mockTasks.forEach((task) => result.current.addUpload(task));
    });

    expect(result.current.uploads).toHaveLength(2);
    expect(result.current.uploads[0].title).toBe('Document 1');
    expect(result.current.uploads[1].title).toBe('Document 2');
  });

  it('should maintain upload order', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    const mockTask = {
      file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      title: 'Test Document',
      subjectId: '1',
      grade: '10',
      type: 'textbook',
    };

    act(() => {
      result.current.addUpload({ ...mockTask, title: 'First' });
      result.current.addUpload({ ...mockTask, title: 'Second' });
      result.current.addUpload({ ...mockTask, title: 'Third' });
    });

    expect(result.current.uploads).toHaveLength(3);
    expect(result.current.uploads[0].title).toBe('First');
    expect(result.current.uploads[1].title).toBe('Second');
    expect(result.current.uploads[2].title).toBe('Third');
  });

  it('should handle remove on non-existent upload gracefully', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    act(() => {
      result.current.removeUpload('non-existent-id');
    });

    expect(result.current.uploads).toHaveLength(0);
  });

  it('should handle cancel on non-existent upload gracefully', () => {
    const { result } = renderHook(() => useUploads(), { wrapper });

    act(() => {
      result.current.cancelUpload('non-existent-id');
    });

    expect(result.current.uploads).toHaveLength(0);
  });

  it('should handle dismiss when no completed uploads exist', async () => {
    const { result } = renderHook(() => useUploads(), { wrapper });
    const initialLength = result.current.uploads.length;

    act(() => {
      result.current.dismissCompleted();
    });

    expect(result.current.uploads).toHaveLength(initialLength);
  });
});
