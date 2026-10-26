import { saveMaterialAnnotation } from '@/lib/actions/viewer';
import type { NoteRecord, HighlightRect } from '@/lib/types/viewer';
import React, { useState } from 'react';

export function useSelection(
  materialId: string | string[] | undefined,
  user: any,
  pageRefs: React.RefObject<(HTMLDivElement | null)[]>,
  setNotes: React.Dispatch<React.SetStateAction<NoteRecord[]>>,
) {
  const [areaSelectionMode, setAreaSelectionMode] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; page: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const [pendingHighlight, setPendingHighlight] = useState<{
    page: number;
    type: 'highlight' | 'area';
    rects: HighlightRect[];
    text?: string;
    position: { x: number; y: number };
  } | null>(null);

  const handleTextSelection = () => {
    if (areaSelectionMode) return;
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPendingHighlight((prev) => (prev?.type === 'highlight' ? null : prev));
        return;
      }
      const text = selection.toString();
      if (!text.trim()) return;
      const range = selection.getRangeAt(0);
      const clientRects = Array.from(range.getClientRects());
      if (clientRects.length === 0) return;

      let foundPage = 0;
      let pageContainer: HTMLDivElement | null = null;
      for (let i = 0; i < (pageRefs.current?.length || 0); i++) {
        const el = pageRefs.current?.[i];
        if (el && el.contains(selection.anchorNode)) {
          foundPage = i + 1;
          pageContainer = el;
          break;
        }
      }
      if (!foundPage || !pageContainer) {
        setPendingHighlight((prev) => (prev?.type === 'highlight' ? null : prev));
        return;
      }

      const pageRect = pageContainer.getBoundingClientRect();
      const rects = clientRects.map((r) => ({
        x: ((r.left - pageRect.left) / pageRect.width) * 100,
        y: ((r.top - pageRect.top) / pageRect.height) * 100,
        width: (r.width / pageRect.width) * 100,
        height: (r.height / pageRect.height) * 100,
      }));

      const firstRect = clientRects[0];
      setPendingHighlight({
        page: foundPage,
        type: 'highlight',
        text,
        rects,
        position: { x: firstRect.left, y: Math.max(10, firstRect.top - 50) },
      });
    }, 10);
  };

  const onPageMouseDown = (e: React.MouseEvent, pageIndex: number) => {
    if (!areaSelectionMode) return;
    e.preventDefault();
    const el = pageRefs.current?.[pageIndex];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDrawStart({ x, y, page: pageIndex + 1 });
    setDrawCurrent({ x, y });
    setPendingHighlight(null);
  };

  const onPageMouseMove = (e: React.MouseEvent, pageIndex: number) => {
    if (!areaSelectionMode || !drawStart || drawStart.page !== pageIndex + 1) return;
    const el = pageRefs.current?.[pageIndex];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDrawCurrent({ x, y });
  };

  const onPageMouseUp = (e: React.MouseEvent, pageIndex: number) => {
    if (!areaSelectionMode || !drawStart || drawStart.page !== pageIndex + 1 || !drawCurrent)
      return;

    const minX = Math.min(drawStart.x, drawCurrent.x);
    const maxX = Math.max(drawStart.x, drawCurrent.x);
    const minY = Math.min(drawStart.y, drawCurrent.y);
    const maxY = Math.max(drawStart.y, drawCurrent.y);
    const width = maxX - minX;
    const height = maxY - minY;

    const el = pageRefs.current?.[pageIndex];
    if (!el) return;
    const pageRect = el.getBoundingClientRect();
    const absBottom = pageRect.top + (maxY / 100) * pageRect.height;
    const absLeft = pageRect.left + (minX / 100) * pageRect.width;

    if (width > 0.5 && height > 0.5) {
      setPendingHighlight({
        page: pageIndex + 1,
        type: 'area',
        rects: [{ x: minX, y: minY, width, height }],
        position: { x: absLeft, y: absBottom + 20 },
      });
    }

    setDrawStart(null);
    setDrawCurrent(null);
    setAreaSelectionMode(false);
  };

  const saveHighlight = async (colorName: string) => {
    if (!pendingHighlight || !user || !materialId) return;

    const annotationData: NoteRecord['annotation_data'] = {
      page: pendingHighlight.page,
      type: pendingHighlight.type,
      text: pendingHighlight.text,
      color: colorName,
      rects: pendingHighlight.rects,
    };

    const tempId = `temp-${Date.now()}`;
    const optimistic: NoteRecord = { id: tempId, annotation_data: annotationData };
    setNotes((prev) =>
      [...prev, optimistic].sort(
        (a, b) => (a.annotation_data.page || 0) - (b.annotation_data.page || 0),
      ),
    );
    setPendingHighlight(null);
    window.getSelection()?.removeAllRanges();

    const id = Array.isArray(materialId) ? materialId[0] : materialId;
    const result = await saveMaterialAnnotation({
      resourceId: id,
      pageNumber: pendingHighlight.page,
      annotationData,
    });

    if (result.id) {
      setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...n, id: result.id! } : n)));
    }
  };

  return {
    areaSelectionMode,
    setAreaSelectionMode,
    drawStart,
    drawCurrent,
    pendingHighlight,
    setPendingHighlight,
    handleTextSelection,
    onPageMouseDown,
    onPageMouseMove,
    onPageMouseUp,
    saveHighlight,
  };
}
