'use client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

export interface MaterialCardProps {
  id: string;
  title: string;
  subject: string;
  grades: number[];
  materialType: 'Textbook' | 'Guide' | 'Question Bank' | 'Reference';
  coverImage?: string;
  pdfPreviewUrl?: string;
  progress?: number;
  onClick?: () => void;
  isBookmarked?: boolean;
}

import { SUBJECT_MAP } from '@/lib/constants/subjects';

const TYPE_ICON: Record<string, IconName> = {
  Textbook: 'book',
  Guide: 'books',
  'Question Bank': 'help_circle',
  Reference: 'description',
};

const thumbCache = new Map<string, string>();
const thumbInFlight = new Map<string, Promise<string | null>>();
const THUMB_WIDTH = 320;

function getThumbStorageKey(materialId: string) {
  return `material-thumb:${materialId}`;
}

function readCachedThumb(materialId: string): string | null {
  const fromMemory = thumbCache.get(materialId);
  if (fromMemory) return fromMemory;

  try {
    const fromStorage = localStorage.getItem(getThumbStorageKey(materialId));
    if (fromStorage) {
      thumbCache.set(materialId, fromStorage);
      return fromStorage;
    }
  } catch {
    // Ignore storage read errors and continue without persistent cache.
  }

  return null;
}

async function buildFirstPageThumb(materialId: string, pdfUrl: string): Promise<string | null> {
  const cached = readCachedThumb(materialId);
  if (cached) return cached;

  const existing = thumbInFlight.get(materialId);
  if (existing) return existing;

  const task = (async () => {
    try {
      const { pdfjs } = await import('react-pdf');
      // Always force an absolute public URL to avoid route-relative
      // requests like /student/pdf.worker.mjs.
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const doc = await pdfjs.getDocument({ url: pdfUrl }).promise;
      const page = await doc.getPage(1);

      const baseViewport = page.getViewport({ scale: 1 });
      const scale = THUMB_WIDTH / Math.max(1, baseViewport.width);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;

      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const thumbDataUrl = canvas.toDataURL('image/webp', 0.82);

      thumbCache.set(materialId, thumbDataUrl);
      try {
        localStorage.setItem(getThumbStorageKey(materialId), thumbDataUrl);
      } catch {
        // Ignore storage write errors (quota/private mode).
      }

      await doc.destroy();
      return thumbDataUrl;
    } catch {
      return null;
    } finally {
      thumbInFlight.delete(materialId);
    }
  })();

  thumbInFlight.set(materialId, task);
  return task;
}

export function MaterialCard({
  id,
  title,
  subject,
  materialType,
  coverImage,
  pdfPreviewUrl,
  progress = 0,
  onClick,
  isBookmarked = false,
}: MaterialCardProps) {
  const cfg = SUBJECT_MAP[subject] ?? {
    iconName: 'library' as IconName,
  };
  const typeIcon = TYPE_ICON[materialType] ?? ('file' as IconName);
  const hasProgress = progress > 0;
  const [generatedThumb, setGeneratedThumb] = useState<{ id: string; src: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (coverImage || !pdfPreviewUrl) return () => (cancelled = true);

    const cached = readCachedThumb(id);
    if (cached) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setGeneratedThumb({ id, src: cached });
        }
      });
      return () => {
        cancelled = true;
      };
    }

    buildFirstPageThumb(id, pdfPreviewUrl).then((thumb) => {
      if (!cancelled && thumb) {
        setGeneratedThumb({ id, src: thumb });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [coverImage, id, pdfPreviewUrl]);

  const displayCover = coverImage ?? (generatedThumb?.id === id ? generatedThumb.src : undefined);

  const placeholder = (
    <div className="bg-muted/70 flex h-full w-full items-center justify-center">
      <Icon name={cfg.iconName} size="2xl" className="text-muted-foreground/50" />
    </div>
  );

  return (
    <Card
      onClick={onClick}
      className="bg-card border-border group cursor-pointer gap-0 overflow-hidden border"
    >
      {/* Cover */}
      <div className="bg-muted/30 relative h-40 overflow-hidden">
        {displayCover ? (
          <img src={displayCover} alt={title} className="h-full w-full object-cover" />
        ) : (
          placeholder
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />

        <Badge className="bg-background/90 text-foreground border-border absolute top-2.5 left-2.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
          {subject}
        </Badge>

        {isBookmarked && (
          <span className="bg-primary text-primary-foreground absolute top-2.5 right-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm">
            <Icon name="star" size="xs" filled />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="relative flex flex-col gap-2.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-card-foreground line-clamp-1 flex-1 text-sm leading-snug font-semibold tracking-tight">
            {title}
          </h3>
          <Badge className="text-accent-foreground bg-accent inline-flex shrink-0 items-center gap-1 text-xs font-medium">
            <Icon name={typeIcon} size="xs" />
            {materialType}
          </Badge>
        </div>

        {hasProgress && (
          <div className="mt-0.5 space-y-1.5">
            <div className="flex items-center justify-end">
              {progress < 100 ? (
                <span className="text-muted-foreground text-xs font-medium tabular-nums">
                  {progress}%
                </span>
              ) : (
                <Badge className="text-success bg-success/20 border-success rounded-full px-2 py-0.5 text-xs font-semibold">
                  Done
                </Badge>
              )}
            </div>
            {progress < 100 && (
              <Progress
                value={progress}
                className="absolute right-0 bottom-0 left-0 h-2 rounded-none"
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
