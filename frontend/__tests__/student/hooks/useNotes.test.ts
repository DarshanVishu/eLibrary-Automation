import { useNotes } from '@/lib/hooks/useNotes';
import * as viewerActions from '@/lib/actions/viewer';
import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/actions/viewer', () => ({
  getMaterialAnnotations: vi.fn(),
  saveMaterialAnnotation: vi.fn(),
  updateMaterialAnnotation: vi.fn(),
  deleteMaterialAnnotation: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('useNotes Hook', () => {
  const mockSetPanelOpen = vi.fn();
  const mockNotesPanelRef = { current: { expand: vi.fn() } };
  const mockUser = { id: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should barely initialize when user or materialId is missing', () => {
    renderHook(() => useNotes(undefined, null, mockSetPanelOpen, mockNotesPanelRef));
    expect(viewerActions.getMaterialAnnotations).not.toHaveBeenCalled();
  });

  it('should fetch and set notes on mount', async () => {
    const mockData = [
      {
        id: 'note-2',
        annotation_data: {
          page: 1,
          type: 'highlight' as const,
          rects: [{ x: 0, y: 0, width: 10, height: 10 }],
        },
      },
      { id: 'note-1', annotation_data: { page: 2, type: 'note' as const, note: 'Test1' } },
    ];

    (viewerActions.getMaterialAnnotations as any).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() =>
      useNotes('mat-1', mockUser, mockSetPanelOpen, mockNotesPanelRef),
    );

    await waitFor(() => {
      expect(result.current.notes.length).toBe(2);
    });

    expect(result.current.notes[0].id).toBe('note-2'); // page 1
    expect(result.current.notes[1].id).toBe('note-1'); // page 2
  });

  it('should add note optimistically and sync with server', async () => {
    (viewerActions.getMaterialAnnotations as any).mockResolvedValueOnce([]);
    (viewerActions.saveMaterialAnnotation as any).mockResolvedValueOnce({ id: 'db-note-id' });

    const { result } = renderHook(() =>
      useNotes('mat-1', mockUser, mockSetPanelOpen, mockNotesPanelRef),
    );

    await waitFor(() => {
      expect(result.current.notes.length).toBe(0);
    });

    await act(async () => {
      await result.current.addNote(5, 'Hello New Note');
    });

    expect(mockSetPanelOpen).toHaveBeenCalledWith(true);
    expect(mockNotesPanelRef.current.expand).toHaveBeenCalled();
    expect(viewerActions.saveMaterialAnnotation).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.notes[0].id).toBe('db-note-id');
      expect(result.current.notes[0].annotation_data.note).toBe('Hello New Note');
    });
  });

  it('should show toast error if addNote fails', async () => {
    (viewerActions.getMaterialAnnotations as any).mockResolvedValueOnce([]);
    (viewerActions.saveMaterialAnnotation as any).mockResolvedValueOnce({
      id: null,
      error: 'Insert failed',
    });

    const { result } = renderHook(() =>
      useNotes('mat-1', mockUser, mockSetPanelOpen, mockNotesPanelRef),
    );

    await waitFor(() => {
      expect(result.current.notes.length).toBe(0);
    });

    await act(async () => {
      await result.current.addNote(1, 'Failing note');
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to save note. Please try again.');
  });

  it('should delete a note locally and call delete on server', async () => {
    const mockData = [
      { id: 'note-1', annotation_data: { page: 1, type: 'note' as const, note: 'Test1' } },
    ];
    (viewerActions.getMaterialAnnotations as any).mockResolvedValueOnce(mockData);
    (viewerActions.deleteMaterialAnnotation as any).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() =>
      useNotes('mat-1', mockUser, mockSetPanelOpen, mockNotesPanelRef),
    );

    await waitFor(() => {
      expect(result.current.notes.length).toBe(1);
    });

    await act(async () => {
      await result.current.deleteNote('note-1');
    });

    expect(result.current.notes.length).toBe(0);
    expect(viewerActions.deleteMaterialAnnotation).toHaveBeenCalledWith('note-1');
  });

  it('should update a note locally and call update on server', async () => {
    const mockData = [
      { id: 'note-1', annotation_data: { page: 1, type: 'note' as const, note: 'Old text' } },
    ];
    (viewerActions.getMaterialAnnotations as any).mockResolvedValueOnce(mockData);
    (viewerActions.updateMaterialAnnotation as any).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() =>
      useNotes('mat-1', mockUser, mockSetPanelOpen, mockNotesPanelRef),
    );

    await waitFor(() => {
      expect(result.current.notes.length).toBe(1);
    });

    await act(async () => {
      await result.current.updateNote('note-1', { note: 'New text' });
    });

    expect(result.current.notes[0].annotation_data.note).toBe('New text');
    expect(result.current.notes[0].annotation_data.updatedAt).toBeDefined();

    await waitFor(() => {
      expect(viewerActions.updateMaterialAnnotation).toHaveBeenCalled();
    });
  });
});
