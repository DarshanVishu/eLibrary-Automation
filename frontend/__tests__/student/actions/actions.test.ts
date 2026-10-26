import { getStudentMaterials } from '@/app/student/actions';
import { createClient } from '@/lib/supabase/server';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock the Supabase module that is used in the actions file
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Provide a mock for @/lib/supabase/client as well, just in case it's used elsewhere
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('getStudentMaterials Server Action', () => {
  let mockGetUser: Mock;
  let mockRpc: Mock;
  let mockCreateSignedUrls: Mock;
  let mockFrom: Mock;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });
    mockCreateSignedUrls = vi.fn().mockResolvedValue({ data: [] });

    // Separate mocks for DB vs storage API from methods
    const mockStorageFrom = vi.fn().mockReturnValue({ createSignedUrls: mockCreateSignedUrls });
    const mockDbQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('Profile error') }),
    };
    const mockDbFrom = vi.fn().mockReturnValue(mockDbQuery);
    mockFrom = mockStorageFrom; // Keep reference for assertions in storage tests

    // Setup the mock supabase client
    const mockSupabase = {
      auth: { getUser: mockGetUser },
      rpc: mockRpc,
      from: mockDbFrom,
      storage: { from: mockStorageFrom },
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  it('should return empty array if no user is found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await getStudentMaterials();

    expect(result).toEqual({ materials: [], bypassEnabled: false, studentGrade: 0 });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return empty array if RPC returns an error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('RPC Error') });

    const result = await getStudentMaterials();

    expect(result).toEqual({ materials: [], bypassEnabled: false, studentGrade: 0 });
  });

  it('should return empty array if RPC returns no rows', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await getStudentMaterials();

    expect(result).toEqual({ materials: [], bypassEnabled: false, studentGrade: 0 });
  });

  it('should call RPC with correct user ID parameter', async () => {
    // Mock a successful response to ensure execution passes the error check
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'mat-1',
          title: 'Math Book',
          subject_name: 'Math',
          material_type: 'textbook',
          source_url: 'https://example.com/math.pdf',
        },
      ],
      error: null,
    });

    await getStudentMaterials();

    expect(mockRpc).toHaveBeenCalledWith('get_student_library', {
      p_user_id: 'user-123',
    });
  });

  it('should return mapped materials successfully (using external source_url)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'mat-1',
          title: 'Math Book',
          subject_name: 'Math',
          grades: [6, 7],
          material_type: 'textbook',
          source_url: 'https://example.com/math.pdf',
          thumbnail_url: 'https://example.com/thumb.jpg',
          progress_pct: '50',
          last_viewed_at: '2023-10-01T12:00:00Z',
          is_bookmarked: true,
          created_at: '2023-09-01T12:00:00Z',
          academic_year: '2023-2024',
        },
      ],
      error: null,
    });

    const result = await getStudentMaterials();

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0]).toEqual({
      id: 'mat-1',
      title: 'Math Book',
      subject: 'Math',
      grades: [6, 7],
      materialType: 'Textbook',
      coverImage: 'https://example.com/thumb.jpg',
      pdfPreviewUrl: 'https://example.com/math.pdf',
      progress: 50,
      lastViewed: '2023-10-01T12:00:00Z',
      isBookmarked: true,
      addedDate: '2023-09-01T12:00:00Z',
      academicYear: '2023-2024',
    });

    // Ensure storage API is not called when there's no storage_path
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should generate signed URLs for resources with a storage_path', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'mat-2',
          title: 'Science Guide',
          subject_name: 'Science',
          grades: [8],
          material_type: 'guide',
          storage_path: 'science/guide.pdf',
        },
      ],
      error: null,
    });

    mockCreateSignedUrls.mockResolvedValueOnce({
      data: [
        {
          path: 'science/guide.pdf',
          signedUrl: 'https://supabase.com/signed/guide.pdf',
        },
      ],
    });

    const result = await getStudentMaterials();

    expect(mockFrom).toHaveBeenCalledWith('library-files');
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(['science/guide.pdf'], 3600);

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0]).toMatchObject({
      id: 'mat-2',
      title: 'Science Guide',
      pdfPreviewUrl: 'https://supabase.com/signed/guide.pdf',
      materialType: 'Guide',
    });
  });

  it('should fallback to source_url if signed url generation fails or returns empty', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'mat-3',
          title: 'History Notes',
          material_type: 'reference',
          storage_path: 'history/notes.pdf',
          source_url: 'https://example.com/fallback.pdf',
        },
      ],
      error: null,
    });

    // Simulate failure or empty response from storage API
    mockCreateSignedUrls.mockResolvedValueOnce({
      data: null,
    });

    const result = await getStudentMaterials();

    expect(result.materials).toHaveLength(1);
    // Should fallback to source_url
    expect(result.materials[0].pdfPreviewUrl).toBe('https://example.com/fallback.pdf');
  });

  it('should apply fallback default values correctly when fields are missing', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'mat-4',
          title: 'Unknown Book',
          // Missing subject, missing grades array, missing progress_pct,
          // and an unknown material type (will default to Reference)
          material_type: 'unknown_type',
        },
      ],
      error: null,
    });

    const result = await getStudentMaterials();

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0]).toMatchObject({
      id: 'mat-4',
      title: 'Unknown Book',
      subject: 'General',
      grades: [], // Empty array when null/empty from RPC
      materialType: 'Reference', // Default fallback type
      progress: 0,
      isBookmarked: false,
    });
    // Optional properties should be undefined when not provided
    expect(result.materials[0].coverImage).toBeUndefined();
    expect(result.materials[0].pdfPreviewUrl).toBeUndefined();
    expect(result.materials[0].lastViewed).toBeUndefined();
    expect(result.materials[0].academicYear).toBeUndefined();
  });
});
