import { useMaterialData } from '@/lib/hooks/useMaterialData';
import * as viewerActions from '@/lib/actions/viewer';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/actions/viewer', () => ({
  getMaterialViewerData: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useMaterialData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch data if materialId is undefined', async () => {
    const { result } = renderHook(() => useMaterialData(undefined));

    expect(result.current.materialLoading).toBe(false);
    expect(result.current.material).toBeNull();
    expect(viewerActions.getMaterialViewerData).not.toHaveBeenCalled();
  });

  it('should handle fetching error and show toast', async () => {
    (viewerActions.getMaterialViewerData as any).mockResolvedValueOnce({
      material: null,
      error: 'Db Error',
    });

    const { result } = renderHook(() => useMaterialData('mat-1'));

    // Should initially be loading
    expect(result.current.materialLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.materialLoading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load this resource. Please try again.'),
    );
    expect(result.current.material).toBeNull();
  });

  it('should successfully fetch material and format properties', async () => {
    (viewerActions.getMaterialViewerData as any).mockResolvedValueOnce({
      material: {
        id: 'mat-2',
        title: 'Science Basics',
        subject: 'Science',
        grade: 8,
        pdfUrl: 'https://example.com/math.pdf',
      },
      isBookmarked: false,
    });

    const { result } = renderHook(() => useMaterialData('mat-2'));

    await waitFor(() => {
      expect(result.current.materialLoading).toBe(false);
    });

    expect(result.current.material).toEqual({
      id: 'mat-2',
      title: 'Science Basics',
      subject: 'Science',
      grade: 8,
      pdfUrl: 'https://example.com/math.pdf',
    });
  });
});
