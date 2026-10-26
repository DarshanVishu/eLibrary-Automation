import { getStudentMaterials } from '@/app/student/actions';
import { useAuth } from '@/lib/context/auth-context';
import { useStudentMaterials } from '@/lib/hooks/useStudentMaterials';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/app/student/actions', () => ({
  getStudentMaterials: vi.fn(),
}));

vi.mock('@/lib/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useStudentMaterials Hook', () => {
  const mockRouter = {
    replace: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('should return loading state when auth is loading', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: true });

    const { result } = renderHook(() => useStudentMaterials());

    expect(result.current).toEqual({
      user: null,
      materials: [],
      loading: true,
      bypassEnabled: false,
      studentGrade: 0,
      refetch: expect.any(Function),
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(getStudentMaterials).not.toHaveBeenCalled();
  });

  it('should redirect to home and return loading when user is not authenticated and auth loading is false', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: false });

    const { result } = renderHook(() => useStudentMaterials());

    expect(result.current).toEqual({
      user: null,
      materials: [],
      loading: false,
      bypassEnabled: false,
      studentGrade: 0,
      refetch: expect.any(Function),
    });
    expect(getStudentMaterials).not.toHaveBeenCalled();
  });

  it('should fetch materials and return them when user is authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockMaterials = [{ id: 'mat-1', title: 'Test Book' }];

    (useAuth as any).mockReturnValue({ user: mockUser, loading: false });
    (getStudentMaterials as any).mockResolvedValue({
      materials: mockMaterials,
      bypassEnabled: false,
      studentGrade: 6,
    });

    const { result } = renderHook(() => useStudentMaterials());

    // Initially loading should be true because data Loading state
    expect(result.current).toEqual({
      user: mockUser,
      materials: [],
      loading: true,
      bypassEnabled: false,
      studentGrade: 0,
      refetch: expect.any(Function),
    });

    // Wait for the async useEffect to finish loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.materials).toEqual(mockMaterials);
    expect(result.current.user).toEqual(mockUser);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should show toast error and set materials to empty if fetching fails', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    (useAuth as any).mockReturnValue({ user: mockUser, loading: false });
    (getStudentMaterials as any).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useStudentMaterials());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to load your library. Please try again.');
    expect(result.current.materials).toEqual([]);
  });

  it('should allow refetching materials', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const initialMaterials = [{ id: 'mat-1', title: 'Test Book' }];
    const fetchedMaterials = [
      { id: 'mat-1', title: 'Test Book' },
      { id: 'mat-2', title: 'New Book' },
    ];

    (useAuth as any).mockReturnValue({ user: mockUser, loading: false });
    (getStudentMaterials as any)
      .mockResolvedValueOnce({ materials: initialMaterials, bypassEnabled: false, studentGrade: 6 })
      .mockResolvedValueOnce({
        materials: fetchedMaterials,
        bypassEnabled: false,
        studentGrade: 6,
      });

    const { result } = renderHook(() => useStudentMaterials());

    await waitFor(() => {
      expect(result.current.materials).toEqual(initialMaterials);
    });

    await act(async () => {
      await result.current.refetch!();
    });

    expect(result.current.materials).toEqual(fetchedMaterials);
    expect(getStudentMaterials).toHaveBeenCalledTimes(2);
  });
});
