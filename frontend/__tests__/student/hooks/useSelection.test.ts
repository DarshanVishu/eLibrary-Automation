import { useSelection } from '@/lib/hooks/useSelection';
import * as viewerActions from '@/lib/actions/viewer';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/actions/viewer', () => ({
  saveMaterialAnnotation: vi.fn(),
}));

describe('useSelection Hook', () => {
  const mockSetNotes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      useSelection('mat-1', { id: 'u1' }, { current: [] }, mockSetNotes),
    );

    expect(result.current.areaSelectionMode).toBe(false);
    expect(result.current.drawStart).toBeNull();
    expect(result.current.drawCurrent).toBeNull();
    expect(result.current.pendingHighlight).toBeNull();
  });

  it('can toggle area selection mode', () => {
    const { result } = renderHook(() =>
      useSelection('mat-1', { id: 'u1' }, { current: [] }, mockSetNotes),
    );

    act(() => {
      result.current.setAreaSelectionMode(true);
    });

    expect(result.current.areaSelectionMode).toBe(true);
  });

  it('saveHighlight should do nothing if pendingHighlight is missing', async () => {
    const { result } = renderHook(() =>
      useSelection('mat-1', { id: 'u1' }, { current: [] }, mockSetNotes),
    );

    await act(async () => {
      await result.current.saveHighlight('yellow');
    });

    expect(viewerActions.saveMaterialAnnotation).not.toHaveBeenCalled();
    expect(mockSetNotes).not.toHaveBeenCalled();
  });

  it('saveHighlight inserts pending highlight and clears selection', async () => {
    (viewerActions.saveMaterialAnnotation as any).mockResolvedValueOnce({
      id: 'highlight-inserted',
    });

    const { result } = renderHook(() =>
      useSelection('mat-1', { id: 'u1' }, { current: [] }, mockSetNotes),
    );

    // Manually push a pending highlight
    act(() => {
      result.current.setPendingHighlight({
        page: 1,
        type: 'highlight',
        text: 'Some cool text',
        rects: [{ x: 10, y: 10, width: 50, height: 10 }],
        position: { x: 50, y: 50 },
      });
    });

    // Mock clear window selection
    const mockRemoveAllRanges = vi.fn();
    vi.stubGlobal('getSelection', () => ({ removeAllRanges: mockRemoveAllRanges }));

    await act(async () => {
      await result.current.saveHighlight('blue');
    });

    expect(mockSetNotes).toHaveBeenCalled();
    expect(result.current.pendingHighlight).toBeNull();
    expect(mockRemoveAllRanges).toHaveBeenCalled();

    expect(viewerActions.saveMaterialAnnotation).toHaveBeenCalledWith({
      resourceId: 'mat-1',
      pageNumber: 1,
      annotationData: {
        page: 1,
        type: 'highlight',
        text: 'Some cool text',
        color: 'blue',
        rects: [{ x: 10, y: 10, width: 50, height: 10 }],
      },
    });

    vi.unstubAllGlobals();
  });
});
