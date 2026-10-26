import { getMaterialViewerData, toggleBookmarkAction } from '@/lib/actions/viewer';
import type { MaterialData } from '@/lib/types/viewer';
import { useState, useEffect, useCallback } from 'react';

export function useBookmark(
  materialId: string | string[] | undefined,
  user: any,
  material: MaterialData | null,
) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!user || !materialId) return;
    const id = Array.isArray(materialId) ? materialId[0] : materialId;

    getMaterialViewerData(id).then((res) => {
      if (res && typeof res.isBookmarked === 'boolean') {
        setIsBookmarked(res.isBookmarked);
      }
    });
  }, [user, materialId]);

  const toggleBookmark = useCallback(async () => {
    if (!user || !material) return;
    // Optimistic update
    const next = !isBookmarked;
    setIsBookmarked(next);

    const { isBookmarked: serverStatus, error } = await toggleBookmarkAction(material.id);

    if (error) {
      // Rollback on failure
      setIsBookmarked(!next);
    } else {
      setIsBookmarked(serverStatus);
    }
  }, [isBookmarked, user, material]);

  return { isBookmarked, toggleBookmark };
}
