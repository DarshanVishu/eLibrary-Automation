'use client';

import { Dots_v4 } from '@/components/shared/dots-animation';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export function AdminPdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(550);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.floor(el.clientWidth - 32);
      if (w > 100) setContainerWidth(w);
    };

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    updateWidth();

    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* PDF Canvas Container */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 pb-16">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex h-64 items-center justify-center">
              <Dots_v4 />
            </div>
          }
          error={
            <div className="text-destructive flex h-64 flex-col items-center justify-center gap-2 text-sm font-medium">
              <Icon name="error" size="md" />
              Failed to load PDF preview.
            </div>
          }
          className="flex flex-col items-center"
        >
          {numPages > 0 && (
            <div className="border-border bg-card overflow-hidden rounded border shadow-md">
              <Page
                key={currentPage}
                pageNumber={currentPage}
                width={Math.max(250, containerWidth)}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          )}
        </Document>
      </div>

      {/* Floating Bottom Toolbar Overlay */}
      {numPages > 0 && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <div className="bg-background/90 border-border flex items-center gap-2 rounded-full border px-3 py-1 shadow-lg backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-7 w-7 rounded-full"
              title="Previous Page"
              type="button"
            >
              <Icon name="chevron_left" size="sm" />
            </Button>

            <span className="text-foreground px-1 text-xs font-semibold whitespace-nowrap select-none">
              {currentPage} / {numPages}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="h-7 w-7 rounded-full"
              title="Next Page"
              type="button"
            >
              <Icon name="chevron_right" size="sm" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
