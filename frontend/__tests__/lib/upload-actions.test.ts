import { mockSupabase, resetAllMocks } from '../__mocks__/supabase';
import { saveUploadMetadata } from '@/lib/actions/upload';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'user@test.com',
    role: 'teacher',
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('saveUploadMetadata', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  it('saves upload metadata including optional bookId', async () => {
    mockSupabase.auth = {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    } as any;

    const singleProfileFn = vi.fn().mockResolvedValue({ data: { role: 'teacher' } });
    const eqProfileFn = vi.fn().mockReturnValue({ single: singleProfileFn });
    const selectProfileFn = vi.fn().mockReturnValue({ eq: eqProfileFn });

    const insertResourceFn = vi.fn().mockResolvedValue({ error: null });
    const insertGradeFn = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'profiles') return { select: selectProfileFn } as any;
      if (table === 'resources') return { insert: insertResourceFn } as any;
      if (table === 'resource_grade_access') return { insert: insertGradeFn } as any;
      return {} as any;
    });

    const result = await saveUploadMetadata({
      resourceId: 'res-upload-1',
      bookId: 'BK-NCERT-09',
      title: 'Mathematics Class 9',
      subjectId: '1',
      grade: 9,
      type: 'textbook',
      storagePath: 'res-upload-1/math.pdf',
      fileMime: 'application/pdf',
      fileSizeBytes: 1048576,
      pageCount: 50,
    });

    expect(result).toEqual({ success: true });
    expect(insertResourceFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'res-upload-1',
        book_id: 'BK-NCERT-09',
        title: 'Mathematics Class 9',
        subject_id: 1,
        material_type: 'textbook',
        storage_path: 'res-upload-1/math.pdf',
      }),
    );
  });

  it('saves upload metadata with null bookId when omitted or empty', async () => {
    mockSupabase.auth = {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    } as any;

    const singleProfileFn = vi.fn().mockResolvedValue({ data: { role: 'admin' } });
    const eqProfileFn = vi.fn().mockReturnValue({ single: singleProfileFn });
    const selectProfileFn = vi.fn().mockReturnValue({ eq: eqProfileFn });

    const insertResourceFn = vi.fn().mockResolvedValue({ error: null });
    const insertGradeFn = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'profiles') return { select: selectProfileFn } as any;
      if (table === 'resources') return { insert: insertResourceFn } as any;
      if (table === 'resource_grade_access') return { insert: insertGradeFn } as any;
      return {} as any;
    });

    const result = await saveUploadMetadata({
      resourceId: 'res-upload-2',
      bookId: '   ',
      title: 'Physics Class 10',
      subjectId: '2',
      grade: 10,
      type: 'guide',
      storagePath: 'res-upload-2/physics.pdf',
      fileMime: 'application/pdf',
      fileSizeBytes: 2048576,
      pageCount: 30,
    });

    expect(result).toEqual({ success: true });
    expect(insertResourceFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'res-upload-2',
        book_id: null,
        title: 'Physics Class 10',
      }),
    );
  });
});
