import { useBookmark } from '@/lib/hooks/useBookmark';
import * as viewerActions from '@/lib/actions/viewer';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/actions/viewer', () => ({
  getMaterialViewerData: vi.fn(),
  toggleBookmarkAction: vi.fn(),
}));

describe('useBookmark Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should bypass fetch if user or materialId are missing', () => {
    renderHook(() => useBookmark(undefined, null, null));
    expect(viewerActions.getMaterialViewerData).not.toHaveBeenCalled();
  });

  it('should initialize isBookmarked to true if record exists', async () => {
    (viewerActions.getMaterialViewerData as any).mockResolvedValueOnce({
      material: { id: 'mat-1' },
      isBookmarked: true,
    });

    const user = { id: 'user-123' };
    const { result } = renderHook(() => useBookmark('mat-1', user, null));

    expect(result.current.isBookmarked).toBe(false);

    await waitFor(() => {
      expect(result.current.isBookmarked).toBe(true);
    });

    expect(viewerActions.getMaterialViewerData).toHaveBeenCalledWith('mat-1');
  });

  it('should toggle bookmark on and call server action successfully', async () => {
    (viewerActions.getMaterialViewerData as any).mockResolvedValueOnce({
      material: { id: 'mat-1' },
      isBookmarked: false,
    });
    (viewerActions.toggleBookmarkAction as any).mockResolvedValueOnce({
      isBookmarked: true,
    });

    const user = { id: 'user-123' };
    const material = { id: 'mat-1', title: 'Test' };

    const { result } = renderHook(() => useBookmark('mat-1', user, material as any));

    await waitFor(() => {
      expect(result.current.isBookmarked).toBe(false);
    });

    await act(async () => {
      await result.current.toggleBookmark();
    });

    expect(result.current.isBookmarked).toBe(true);
    expect(viewerActions.toggleBookmarkAction).toHaveBeenCalledWith('mat-1');
  });

  it('should rollback bookmark change if action errors out', async () => {
    (viewerActions.getMaterialViewerData as any).mockResolvedValueOnce({
      material: { id: 'mat-1' },
      isBookmarked: false,
    });
    (viewerActions.toggleBookmarkAction as any).mockResolvedValueOnce({
      isBookmarked: false,
      error: 'Action error',
    });

    const user = { id: 'user-123' };
    const material = { id: 'mat-1', title: 'Test' };

    const { result } = renderHook(() => useBookmark('mat-1', user, material as any));

    await waitFor(() => {
      expect(viewerActions.getMaterialViewerData).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.toggleBookmark();
    });

    expect(result.current.isBookmarked).toBe(false);
  });
});
