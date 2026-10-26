import { getMaterialViewerData } from '@/lib/actions/viewer';
import type { MaterialData } from '@/lib/types/viewer';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useMaterialData(materialId: string | string[] | undefined) {
  const [material, setMaterial] = useState<MaterialData | null>(null);
  const [materialLoading, setMaterialLoading] = useState(true);
  const hasShownLoadError = useRef(false);

  useEffect(() => {
    if (!materialId) {
      setMaterialLoading(false);
      return;
    }

    const id = Array.isArray(materialId) ? materialId[0] : materialId;

    async function load() {
      try {
        const { material: mat, error } = await getMaterialViewerData(id);

        if (error) {
          if (!hasShownLoadError.current) {
            hasShownLoadError.current = true;
            const detail = process.env.NODE_ENV !== 'production' ? ` (${error})` : '';
            toast.error(`Failed to load this resource. Please try again.${detail}`);
          }
          setMaterialLoading(false);
          return;
        }

        setMaterial(mat);
      } catch {
        if (!hasShownLoadError.current) {
          hasShownLoadError.current = true;
          toast.error('Unexpected error while loading this resource.');
        }
      } finally {
        setMaterialLoading(false);
      }
    }

    load();
  }, [materialId]);

  return { material, materialLoading };
}
