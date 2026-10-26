import {
  getMaterialAnnotations,
  saveMaterialAnnotation,
  updateMaterialAnnotation,
  deleteMaterialAnnotation,
} from '@/lib/actions/viewer';
import type { NoteRecord } from '@/lib/types/viewer';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useNotes(
  materialId: string | string[] | undefined,
  user: any,
  setPanelOpen: (v: boolean) => void,
  notesPanelRef: React.RefObject<any>,
) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);

  useEffect(() => {
    if (!user || !materialId) return;
    const id = Array.isArray(materialId) ? materialId[0] : materialId;

    async function loadNotes() {
      const data = await getMaterialAnnotations(id);
      if (data) {
        setNotes(data);
      }
    }

    loadNotes();
  }, [user, materialId]);

  const addNote = useCallback(
    async (page: number, noteText: string) => {
      if (!user || !materialId) return;
      const id = Array.isArray(materialId) ? materialId[0] : materialId;
      const noteData: NoteRecord['annotation_data'] = { page, note: noteText, type: 'note' };
      const tempId = `temp-${Date.now()}`;
      const optimistic: NoteRecord = { id: tempId, annotation_data: noteData };
      setNotes((prev) =>
        [...prev, optimistic].sort(
          (a, b) => (a.annotation_data.page || 0) - (b.annotation_data.page || 0),
        ),
      );
      setPanelOpen(true);
      notesPanelRef.current?.expand();

      const result = await saveMaterialAnnotation({
        resourceId: id,
        pageNumber: page,
        annotationData: noteData,
      });

      if (result.error || !result.id) {
        toast.error('Failed to save note. Please try again.');
      } else {
        setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...n, id: result.id! } : n)));
      }
    },
    [user, materialId, notesPanelRef, setPanelOpen],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      await deleteMaterialAnnotation(id);
    },
    [],
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<NoteRecord['annotation_data']>) => {
      const updatedAt = new Date().toISOString();
      let finalData: NoteRecord['annotation_data'] | null = null;

      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === id) {
            finalData = { ...n.annotation_data, ...updates, updatedAt };
            return { ...n, annotation_data: finalData };
          }
          return n;
        }),
      );

      setTimeout(async () => {
        if (!finalData) return;
        await updateMaterialAnnotation(id, finalData);
      }, 0);
    },
    [],
  );

  return { notes, setNotes, addNote, deleteNote, updateNote };
}
