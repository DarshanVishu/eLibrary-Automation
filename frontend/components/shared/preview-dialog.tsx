'use client';

import { getPreviewUrl } from '@/app/admin/library/actions';
import { Dots_v4 } from '@/components/shared/dots-animation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

const AdminPdfViewer = dynamic(
  () => import('@/components/admin/admin-pdf-viewer').then((mod) => mod.AdminPdfViewer),
  { ssr: false },
);
type FetchUrlFn = (id: string) => Promise<{ url?: string; error?: string }>;

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  title: string;
  description?: string;
  /** Override the URL fetcher. Defaults to the admin getPreviewUrl action. */
  fetchUrl?: FetchUrlFn;
}

export function PreviewDialog({
  isOpen,
  onClose,
  resourceId,
  title,
  description = 'Document preview',
  fetchUrl = getPreviewUrl,
}: PreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !resourceId) return;

    unstable_batchedUpdates(() => {
      setIsPreviewLoading(true);
      setPreviewError('');
      setPreviewUrl('');
    });

    fetchUrl(resourceId).then((res) => {
      unstable_batchedUpdates(() => {
        if (res?.url) {
          setPreviewUrl(res.url);
        } else {
          setPreviewError(res?.error || 'Failed to load preview');
        }
        setIsPreviewLoading(false);
      });
    });
  }, [isOpen, resourceId, fetchUrl]);

  const handleClose = () => {
    setPreviewUrl('');
    setPreviewError('');
    setIsPreviewLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="border-border bg-card flex h-[88vh] w-[min(95vw,40rem)] max-w-none! flex-col gap-0 overflow-hidden p-0">
        <div className="border-border border-b px-5 py-4">
          <DialogTitle className="text-foreground text-base font-bold">
            {title || 'PDF Preview'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1 text-xs">
            {description}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {isPreviewLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Dots_v4 />
            </div>
          )}

          {!isPreviewLoading && previewError && (
            <div className="text-destructive flex h-full flex-col items-center justify-center gap-2 text-sm font-medium">
              <Icon name="error" size="md" />
              {previewError}
            </div>
          )}

          {!isPreviewLoading && !previewError && previewUrl && <AdminPdfViewer url={previewUrl} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
