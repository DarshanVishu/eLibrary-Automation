import { mockSupabase, resetAllMocks } from '../../__mocks__/supabase';
import { getTeacherSettingsData } from '@/app/teacher/actions';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the requireAuth function
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'teacher-123',
    email: 'teacher@test.com',
    role: 'teacher',
  }),
}));

// Mock the Next.js cookies API
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => 'mock-cookie-value'),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock the environment variables
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Teacher Actions', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('getTeacherSettingsData', () => {
    it('should return teacher profile data successfully', async () => {
      // Arrange
      const mockProfile = {
        id: 'teacher-123',
        full_name: 'John Teacher',
        email: 'teacher@test.com',
        role: 'teacher',
        is_active: true,
      };

      // Mock the Supabase query
      const mockFrom = vi.mocked(mockSupabase.from);
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockProfile, error: null })),
        })),
      }));

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const result = await getTeacherSettingsData();

      // Assert
      expect(result).toEqual({ profile: mockProfile });
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('id, full_name, email, role, is_active');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockError = { message: 'Database error' };

      // Mock the Supabase query to return an error
      const mockFrom = vi.mocked(mockSupabase.from);
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
        })),
      }));

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const result = await getTeacherSettingsData();

      // Assert
      expect(result).toEqual({ profile: null });
    });
  });

  describe('updateMaterialMetadata', () => {
    it('should update teacher material metadata including bookId', async () => {
      const { updateMaterialMetadata } = await import('@/app/teacher/uploads/actions');

      mockSupabase.auth = {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'teacher-123' } } }),
      } as any;

      const singleResourceFn = vi.fn().mockResolvedValue({
        data: { created_by: 'teacher-123' },
        error: null,
      });
      const eqActiveFn = vi.fn().mockReturnValue({ single: singleResourceFn });
      const eqIdFn = vi.fn().mockReturnValue({ eq: eqActiveFn });
      const selectResourceFn = vi.fn().mockReturnValue({ eq: eqIdFn });

      const maybeSingleSubjectFn = vi.fn().mockResolvedValue({ data: { id: 5, name: 'Science' } });
      const limitSubjectFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleSubjectFn });
      const ilikeSubjectFn = vi.fn().mockReturnValue({ limit: limitSubjectFn });
      const selectSubjectFn = vi.fn().mockReturnValue({ ilike: ilikeSubjectFn });

      const eqUpdateFn = vi.fn().mockResolvedValue({ error: null });
      const updateResourceFn = vi.fn().mockReturnValue({ eq: eqUpdateFn });

      const eqDeleteGradeFn = vi.fn().mockResolvedValue({ error: null });
      const deleteGradeFn = vi.fn().mockReturnValue({ eq: eqDeleteGradeFn });

      const insertGradeFn = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'resources') {
          return {
            select: selectResourceFn,
            update: updateResourceFn,
          } as any;
        }
        if (table === 'subjects') return { select: selectSubjectFn } as any;
        if (table === 'resource_grade_access')
          return { delete: deleteGradeFn, insert: insertGradeFn } as any;
        return {} as any;
      });

      const result = await updateMaterialMetadata({
        id: 'res-teacher-1',
        bookId: 'SCI-G10-01',
        title: 'Science Guide Class 10',
        subject: 'Science',
        grade: 10,
        type: 'guide',
      });

      expect(result).toEqual({ success: true });
      expect(updateResourceFn).toHaveBeenCalledWith(
        expect.objectContaining({
          book_id: 'SCI-G10-01',
          title: 'Science Guide Class 10',
          subject_id: 5,
          material_type: 'guide',
        }),
      );
    });
  });
});
