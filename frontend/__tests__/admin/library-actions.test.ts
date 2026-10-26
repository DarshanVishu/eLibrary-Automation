import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { deleteResource, getPreviewUrl } from '@/app/admin/library/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockSupabase = createMockSupabase();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));
vi.mock('@/lib/supabase/admin', () => ({
  getServiceRoleClient: vi.fn(() => mockSupabase),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// ── deleteResource ───────────────────────────────────────────────────────────
describe('deleteResource', () => {
  beforeEach(() => vi.clearAllMocks());

  it('soft-deletes by setting is_active=false', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await deleteResource('res-1');

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ is_active: false });
  });

  it('returns error on DB failure', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: { message: 'Cannot delete' } });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await deleteResource('res-1');

    expect(result.error).toBe('Cannot delete');
  });
});

// ── getPreviewUrl ────────────────────────────────────────────────────────────
describe('getPreviewUrl', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns source_url when available', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { source_url: 'https://example.com/pdf', storage_path: null },
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const result = await getPreviewUrl('res-1');

    expect(result.url).toBe('https://example.com/pdf');
  });

  it('returns signed URL for storage_path when no source_url', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { source_url: null, storage_path: 'uploads/file.pdf' },
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed/file.pdf' },
      error: null,
    });
    mockSupabase.storage.from = vi.fn().mockReturnValue({ createSignedUrl });

    const result = await getPreviewUrl('res-1');

    expect(result.url).toBe('https://storage.example.com/signed/file.pdf');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('library-files');
  });

  it('returns error when resource not found', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const result = await getPreviewUrl('bad-id');

    expect(result.error).toBe('Resource not found');
  });

  it('returns error when no file associated', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { source_url: null, storage_path: null },
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const result = await getPreviewUrl('res-no-file');

    expect(result.error).toBe('No file associated with this resource');
  });

  it('returns error when signed URL generation fails', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { source_url: null, storage_path: 'uploads/file.pdf' },
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const createSignedUrl = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Sign failed' },
    });
    mockSupabase.storage.from = vi.fn().mockReturnValue({ createSignedUrl });

    const result = await getPreviewUrl('res-1');

    expect(result.error).toBe('Failed to generate preview URL');
  });
});

// ── adminUpdateMaterialMetadata ─────────────────────────────────────────────
describe('adminUpdateMaterialMetadata', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates resource metadata including bookId', async () => {
    const { adminUpdateMaterialMetadata } = await import('@/app/admin/library/actions');

    mockSupabase.auth = {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } }),
    } as any;

    const maybeSingleFn = vi.fn().mockResolvedValue({ data: { id: 10, name: 'Mathematics' } });
    const limitFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
    const ilikeFn = vi.fn().mockReturnValue({ limit: limitFn });
    const selectSubjectFn = vi.fn().mockReturnValue({ ilike: ilikeFn });

    const eqResourceFn = vi.fn().mockResolvedValue({ error: null });
    const updateResourceFn = vi.fn().mockReturnValue({ eq: eqResourceFn });

    const eqDeleteGradeFn = vi.fn().mockResolvedValue({ error: null });
    const deleteGradeFn = vi.fn().mockReturnValue({ eq: eqDeleteGradeFn });

    const insertGradeFn = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'subjects') return { select: selectSubjectFn } as any;
      if (table === 'resources') return { update: updateResourceFn } as any;
      if (table === 'resource_grade_access')
        return { delete: deleteGradeFn, insert: insertGradeFn } as any;
      return {} as any;
    });

    const result = await adminUpdateMaterialMetadata({
      id: 'res-1',
      bookId: 'BK-MATH-01',
      title: 'Updated Math',
      subject: 'Mathematics',
      grade: 9,
      type: 'textbook',
    });

    expect(result).toEqual({ success: true });
    expect(updateResourceFn).toHaveBeenCalledWith(
      expect.objectContaining({
        book_id: 'BK-MATH-01',
        title: 'Updated Math',
        subject_id: 10,
        material_type: 'textbook',
      }),
    );
  });
});

// ── getLibraryPageData ──────────────────────────────────────────────────────
describe('getLibraryPageData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filters by grade using inner join without in(id, ...) url explosion', async () => {
    const { getLibraryPageData } = await import('@/app/admin/library/actions');

    const fakeResources = [
      {
        id: 'res-1',
        book_id: 'BK-1',
        title: 'Math Grade 5',
        material_type: 'textbook',
        file_size_bytes: 1024,
        page_count: 10,
        subjects: { name: 'Mathematics' },
        profiles: { full_name: 'Admin' },
        resource_grade_access: [{ grade: 5 }],
      },
    ];

    const rangeFn = vi.fn().mockResolvedValue({ data: fakeResources, count: 1, error: null });
    const orderFn = vi
      .fn()
      .mockReturnValue({ range: rangeFn, eq: vi.fn().mockReturnValue({ range: rangeFn }) });
    const eqActiveFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectResourcesFn = vi.fn().mockReturnValue({ eq: eqActiveFn });

    const inGradeFn = vi
      .fn()
      .mockResolvedValue({ data: [{ resource_id: 'res-1', grade: 5 }], error: null });
    const selectGradeFn = vi.fn().mockReturnValue({ in: inGradeFn });

    const inViewsFn = vi
      .fn()
      .mockResolvedValue({ data: [{ resource_id: 'res-1', views: 42 }], error: null });
    const selectViewsFn = vi.fn().mockReturnValue({ in: inViewsFn });

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'resources') return { select: selectResourcesFn } as any;
      if (table === 'resource_grade_access') return { select: selectGradeFn } as any;
      if (table === 'resource_view_counts') return { select: selectViewsFn } as any;
      return {} as any;
    });

    const result = await getLibraryPageData(0, '', 'all', 'all', '5');

    expect(result.total).toBe(1);
    expect(result.books).toHaveLength(1);
    expect(result.books[0].title).toBe('Math Grade 5');
    expect(result.books[0].grades).toEqual([5]);
    expect(result.books[0].views).toBe(42);
    // Verify inner join was used in select query
    expect(selectResourcesFn).toHaveBeenCalledWith(
      expect.stringContaining('resource_grade_access!inner(grade)'),
      expect.anything(),
    );
  });
});
