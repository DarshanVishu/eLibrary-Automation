import { Dots_v4 } from '@/components/shared/dots-animation';
import { Icon } from '@/components/ui/icon';
import { VIEWER_COLORS } from '@/lib/constants/viewer';
import { NoteRecord } from '@/lib/types/viewer';
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

function LazyPageWrapper({
  index,
  scrollRoot,
  pageWidth,
  rotation = 0,
  loadingElement,
  areaSelectionMode,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onRef,
  children,
}: any) {
  // Pages 0–2 render immediately so the initial viewport is never gated behind
  // an async IntersectionObserver callback (fixes blank-on-first-load race).
  const [isVisible, setIsVisible] = React.useState(index < 3);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Already visible (e.g. first 3 pages) — skip the observer entirely.
    if (isVisible) return;

    // Use the actual scroll container as the IO root, NOT the viewport.
    // The outer wrapperRef div has overflow-hidden. Chrome does not reliably
    // fire IO callbacks for elements inside overflow-hidden ancestors when
    // root=viewport during layout composition (every first client-side
    // navigation). Using the scroll container as root bypasses the clip
    // boundary and fires correctly on first render every time.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: scrollRoot?.current ?? null,
        rootMargin: '500px 0px',
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [scrollRoot, isVisible]);

  const isLandscape = rotation % 180 !== 0;

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (onRef) onRef(el);
      }}
      className="relative overflow-hidden rounded shadow-xl"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        cursor: areaSelectionMode ? 'crosshair' : 'auto',
        userSelect: areaSelectionMode ? 'none' : 'auto',
        minHeight: Math.floor(isLandscape ? pageWidth / 1.414 : pageWidth * 1.414),
        width: pageWidth,
      }}
    >
      {isVisible ? children : loadingElement}
    </div>
  );
}

interface PDFDisplayProps {
  pdfUrl?: string;
  pdfLoading: boolean;
  pdfError: boolean;
  numPages: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageRefs: React.RefObject<(HTMLDivElement | null)[]>;
  pageWidth: number;
  areaSelectionMode: boolean;
  notes: NoteRecord[];
  drawStart: { x: number; y: number; page: number } | null;
  drawCurrent: { x: number; y: number } | null;
  rotation?: number;
  onLoadSuccess: (n: number) => void;
  onLoadError: (err: Error) => void;
  onTextSelection: () => void;
  onPageMouseDown: (e: React.MouseEvent, pageIndex: number) => void;
  onPageMouseMove: (e: React.MouseEvent, pageIndex: number) => void;
  onPageMouseUp: (e: React.MouseEvent, pageIndex: number) => void;
}

export function PDFDisplay({
  pdfUrl,
  pdfLoading,
  pdfError,
  numPages,
  containerRef,
  pageRefs,
  pageWidth,
  areaSelectionMode,
  notes,
  drawStart,
  drawCurrent,
  rotation = 0,
  onLoadSuccess,
  onLoadError,
  onTextSelection,
  onPageMouseDown,
  onPageMouseMove,
  onPageMouseUp,
}: PDFDisplayProps) {
  const [loadingStage, setLoadingStage] = React.useState<0 | 1 | 2>(0);

  React.useEffect(() => {
    if (!pdfLoading) {
      setLoadingStage(0);
      return;
    }

    setLoadingStage(0);
    const timer1 = setTimeout(() => {
      setLoadingStage(1);
    }, 3000);

    const timer2 = setTimeout(() => {
      setLoadingStage(2);
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pdfLoading]);

  const handleLoadSuccess = React.useCallback(
    ({ numPages: n }: { numPages: number }) => onLoadSuccess(n),
    [onLoadSuccess],
  );

  // Stable reference — depends on rotation so placeholder matches page aspect ratio.
  const loadingElement = React.useMemo(
    () => (
      <div
        className="bg-card animate-pulse"
        style={{
          width: '100%',
          aspectRatio: rotation % 180 !== 0 ? '1.414 / 1' : '1 / 1.414',
        }}
      />
    ),
    [rotation],
  );
  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-x-hidden overflow-y-auto"
      onMouseUp={onTextSelection}
    >
      {pdfLoading && !pdfError && (
        <div className="bg-background/80 absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-xs transition-all duration-300">
          <div className="border-border bg-card shadow-strong flex max-w-sm flex-col items-center justify-center rounded-2xl border p-8 text-center transition-all duration-300">
            <div className="bg-primary/10 text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <Icon name="book" className="h-7 w-7 animate-pulse" />
            </div>
            <Dots_v4 />
            <p className="text-foreground mt-4 text-base font-bold transition-all">
              {loadingStage === 0 && 'Loading PDF...'}
              {loadingStage === 1 && 'Please wait, loading textbook...'}
              {loadingStage === 2 && 'Taking longer than usual, please wait...'}
            </p>
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed font-medium">
              {loadingStage === 0 && 'Preparing your textbook pages.'}
              {loadingStage === 1 &&
                'Large textbooks may take a few moments to download and process.'}
              {loadingStage === 2 &&
                'Processing pages and annotations. Thank you for your patience.'}
            </p>
          </div>
        </div>
      )}
      {pdfError && (
        <div className="flex h-full items-center justify-center">
          <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-2xl border p-8 text-center">
            <p className="font-bold">Failed to load PDF</p>
            <p className="text-muted-foreground mt-1 text-sm">Please go back and try again.</p>
          </div>
        </div>
      )}
      <Document
        file={pdfUrl}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={onLoadError}
        loading={null}
        className="flex flex-col items-center gap-4 py-6"
      >
        {numPages > 0 &&
          Array.from({ length: numPages }, (_, i) => (
            <LazyPageWrapper
              key={i}
              index={i}
              scrollRoot={containerRef}
              onRef={(el: any) => {
                if (pageRefs.current) pageRefs.current[i] = el;
              }}
              pageWidth={pageWidth}
              rotation={rotation}
              loadingElement={loadingElement}
              areaSelectionMode={areaSelectionMode}
              onMouseDown={(e: any) => onPageMouseDown(e, i)}
              onMouseMove={(e: any) => onPageMouseMove(e, i)}
              onMouseUp={(e: any) => onPageMouseUp(e, i)}
            >
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                rotate={rotation}
                renderTextLayer
                renderAnnotationLayer
                loading={loadingElement}
              />
              {notes
                .filter(
                  (n) =>
                    n.annotation_data.page === i + 1 &&
                    (n.annotation_data.type === 'highlight' || n.annotation_data.type === 'area'),
                )
                .map((n) => {
                  const colorObj =
                    VIEWER_COLORS.find((c) => c.name === n.annotation_data.color) ||
                    VIEWER_COLORS[0];
                  return (
                    <React.Fragment key={n.id}>
                      {n.annotation_data.rects?.map((r, rIdx) => (
                        <div
                          key={`${n.id}-${rIdx}`}
                          id={rIdx === 0 ? `annotation-${n.id}` : undefined}
                          className="pointer-events-none absolute z-5 mix-blend-multiply"
                          style={{
                            left: `${r.x}%`,
                            top: `${r.y}%`,
                            width: `${r.width}%`,
                            height: `${r.height}%`,
                            backgroundColor: colorObj.rgb,
                            opacity: 0.4,
                          }}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}
              {drawStart && drawStart.page === i + 1 && drawCurrent && (
                <div
                  className="border-primary bg-primary/20 pointer-events-none absolute z-10 border-2 mix-blend-multiply"
                  style={{
                    left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
                    top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
                    width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
                    height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
                  }}
                />
              )}
            </LazyPageWrapper>
          ))}
      </Document>
    </div>
  );
}
