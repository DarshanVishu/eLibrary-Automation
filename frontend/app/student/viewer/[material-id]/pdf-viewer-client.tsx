'use client';

/**
 * WHY THIS FILE WAS REFACTORED (Fix #7)
 *
 * Previously, the core state logic for this component (page tracking, progress saving,
 * resizing, etc) was hidden away in `useViewerLogic.ts`. That hook returned
 * 21+ values, which is an anti-pattern: it was a "kitchen sink" hook that
 * simply grouped code by page rather than by domain.
 *
 * Fix: The logic has been inline back into the component. The 4 domain-specific
 * hooks (`useBookmark`, `useNotes`, `useMaterialData`, `useSelection`) remain
 * separate as they have clear, focused boundaries, but the orchestration logic
 * (like IntersectionObserver and window resizing) rightfully belongs inside the
 * component that actually renders those DOM elements. This eliminates the massive
 * 21-variable destructuring block and makes the component much easier to trace.
 */
import { Dots_v4 } from '@/components/shared/dots-animation';
import { AddNoteModal } from '@/components/student/viewer/add-note-modal';
import { HighlightPopover } from '@/components/student/viewer/highlight-popover';
import { NotesSidebar } from '@/components/student/viewer/notes-sidebar';
import { PDFDisplay } from '@/components/student/viewer/pdf-display';
import { ViewerHeader, PDFOrientation } from '@/components/student/viewer/viewer-header';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { saveReadingProgress } from '@/lib/actions/reading-progress';
import { useAuth } from '@/lib/context/auth-context';
import { useBookmark } from '@/lib/hooks/useBookmark';
import { useMaterialData } from '@/lib/hooks/useMaterialData';
import { useNotes } from '@/lib/hooks/useNotes';
import { useSelection } from '@/lib/hooks/useSelection';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { pdfjs } from 'react-pdf';
import { toast } from 'sonner';

// Set worker once at module-evaluation time; guard prevents re-assignment
// during React 19 concurrent rendering double-invokes.
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export default function PDFViewerClient() {
  const params = useParams<{ 'material-id': string }>();
  const materialId = params['material-id'];
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<any>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const notesPanelRef = useRef<any>(null);

  // ── Core Viewer State ───────────────────────────────────────────
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [groupWidth, setGroupWidth] = useState(1000);

  // ── Notes sidebar minimum width ─────────────────────────────────
  // Change MIN_NOTES_WIDTH to adjust the floor. This is the only place.
  // minSize is 0 when panel is closed so resize(0) isn't blocked by the
  // constraint (see togglePanelOpen). When open, drag is hard-stopped here.
  const MIN_NOTES_WIDTH = 260;
  const savedNotesPanelSize = useRef(25); // remembers size across open/close

  const [panelOpen, setPanelOpen] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [orientation, setOrientation] = useState<PDFOrientation>('portrait');

  const ORIENTATION_ROTATION_MAP = useMemo<Record<PDFOrientation, number>>(
    () => ({
      portrait: 0,
      landscape: 90,
      'landscape-flipped': 270,
    }),
    [],
  );

  const rotation = ORIENTATION_ROTATION_MAP[orientation];

  const handleSwapOrientation = useCallback(() => {
    setOrientation((prev) => {
      if (prev === 'portrait') return 'landscape';
      if (prev === 'landscape') return 'landscape-flipped';
      return 'portrait';
    });
  }, []);

  const scrollToPageElement = useCallback(function scrollToPageElementRef(
    page: number,
    behavior: ScrollBehavior = 'smooth',
    attempt = 0,
  ) {
    const pageEl = pageRefs.current?.[page - 1];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior, block: 'start' });
      return;
    }

    if (attempt >= 20) {
      return;
    }

    window.setTimeout(() => {
      scrollToPageElementRef(page, behavior, attempt + 1);
    }, 100);
  }, []);

  // ── Resume page from URL ?page= param ──────────────────────────
  const searchParams = useSearchParams();
  const resumePage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const hasResumed = useRef(false);

  // ── Hooks ───────────────────────────────────────────────────────
  const { material, materialLoading } = useMaterialData(materialId);
  const { notes, setNotes, addNote, deleteNote, updateNote } = useNotes(
    materialId,
    user,
    setPanelOpen,
    notesPanelRef,
  );
  const { isBookmarked, toggleBookmark } = useBookmark(materialId, user, material);
  const {
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
  } = useSelection(materialId, user, pageRefs, setNotes);

  // Derived minSize: 0 when closed (lets resize(0) succeed), enforced when open.
  const notesMinSize = panelOpen ? (groupWidth > 0 ? (MIN_NOTES_WIDTH / groupWidth) * 100 : 20) : 0;

  const togglePanelOpen = useCallback(() => {
    if (panelOpen) {
      // Save current size so we can restore it on re-open.
      savedNotesPanelSize.current = notesPanelRef.current?.getSize() ?? savedNotesPanelSize.current;
      // Setting panelOpen=false makes notesMinSize=0 on next render.
      // The effect below then calls resize(0) once minSize has cleared.
      setPanelOpen(false);
    } else {
      // Restore to the last manually-dragged size (or default 25%).
      groupRef.current?.setLayout([100 - savedNotesPanelSize.current, savedNotesPanelSize.current]);
      setPanelOpen(true);
    }
  }, [panelOpen, groupRef, notesPanelRef]);

  // Collapse to 0 after minSize has been zeroed out by the render above.
  // Without this effect, resize(0) would be blocked by the old minSize.
  useEffect(() => {
    if (!panelOpen) {
      notesPanelRef.current?.resize(0);
    }
  }, [panelOpen, notesPanelRef]);

  // Measure container width for responsive PDF rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth((prev) => {
        const next = Math.round(entry.contentRect.width);
        return Math.abs(prev - next) > 1 ? next : prev;
      });
    });
    ro.observe(el);
    setContainerWidth(Math.round(el.clientWidth));
    return () => ro.disconnect();
  }, [panelOpen, containerRef]);

  // Measure group width for notes panel minSize percentage calculation
  useEffect(() => {
    const el = document.getElementById('pdf-viewer-layout-v2');
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setGroupWidth((prev) => {
        const next = Math.round(entry.contentRect.width);
        return Math.abs(prev - next) > 1 ? next : prev;
      });
    });
    ro.observe(el);
    setGroupWidth(Math.round(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  // Track which page is currently in view
  useEffect(() => {
    const scrollEl = containerRef.current;
    if (!scrollEl || numPages === 0) return;

    let active = true;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let mostVisible = currentPage;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const idx = pageRefs.current?.indexOf(entry.target as HTMLDivElement);
            if (idx !== undefined && idx !== -1) mostVisible = idx + 1;
          }
        });
        if (active) setCurrentPage(mostVisible);
      },
      { root: scrollEl, threshold: [0.1, 0.3, 0.5, 0.7] },
    );

    const checkAndObserve = () => {
      if (!active) return;
      const els = pageRefs.current?.filter(Boolean) as HTMLDivElement[];
      if (els && els.length === numPages) {
        els.forEach((el) => observer.observe(el));
      } else {
        setTimeout(checkAndObserve, 300);
      }
    };
    checkAndObserve();

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [numPages, panelOpen, containerRef, pageRefs, currentPage]);

  // Persist reading progress on page change
  useEffect(() => {
    if (!user || !materialId || numPages === 0) return;
    const progress = Math.round((currentPage / numPages) * 100);
    saveReadingProgress({
      resourceId: materialId as string,
      lastPage: currentPage,
      progressPct: progress,
    });
  }, [currentPage, numPages, user, materialId]);

  // Jump to resume page once the PDF finishes loading
  useEffect(() => {
    if (hasResumed.current) return; // only once
    if (pdfLoading || numPages === 0) return;
    if (resumePage > 1) {
      hasResumed.current = true;
      setCurrentPage(resumePage);
      scrollToPageElement(resumePage, 'auto');
    }
  }, [numPages, pdfLoading, resumePage, scrollToPageElement]);

  const jumpToAnnotation = useCallback(
    (page: number, annotationId?: string) => {
      setCurrentPage(page);
      setTimeout(() => {
        if (annotationId) {
          const el = document.getElementById(`annotation-${annotationId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
        scrollToPageElement(page);
      }, 100);
    },
    [scrollToPageElement],
  );

  const jumpToPage = useCallback((page: number) => jumpToAnnotation(page), [jumpToAnnotation]);
  const goToPrev = useCallback(
    () => jumpToPage(Math.max(1, currentPage - 1)),
    [currentPage, jumpToPage],
  );
  const goToNext = useCallback(
    () => jumpToPage(Math.min(numPages, currentPage + 1)),
    [currentPage, numPages, jumpToPage],
  );
  const zoomIn = useCallback(() => {
    const el = containerRef.current;
    // Snapshot the scroll position as a ratio of total height before React
    // reflows the layout, so we can restore it after pages resize.
    const ratio = el && el.scrollHeight > 0 ? el.scrollTop / el.scrollHeight : 0;
    setScale((s) => Math.min(s + 0.25, 3.0));
    // Double rAF: first frame React flushes DOM updates,
    // second frame the browser has completed layout with new scrollHeight.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (el) el.scrollTop = ratio * el.scrollHeight;
      });
    });
  }, [containerRef]);

  const zoomOut = useCallback(() => {
    const el = containerRef.current;
    const ratio = el && el.scrollHeight > 0 ? el.scrollTop / el.scrollHeight : 0;
    setScale((s) => Math.max(s - 0.25, 0.5));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (el) el.scrollTop = ratio * el.scrollHeight;
      });
    });
  }, [containerRef]);

  const pageWidth = useMemo(
    () => Math.max(300, Math.min(800, containerWidth - 32)) * scale,
    [containerWidth, scale],
  );

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // ── Close highlight popover on outside click ────────────────────
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const popup = document.getElementById('highlight-popover');
      if (popup && popup.contains(e.target as Node)) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setPendingHighlight((prev) => (prev?.type === 'area' ? null : prev));
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [setPendingHighlight]);

  // ── Guards ──────────────────────────────────────────────────────
  if (authLoading || !user) return null;

  if (materialLoading)
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-3">
        <Dots_v4 />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">
          Please wait, loading material...
        </p>
      </div>
    );

  if (!material?.pdfUrl)
    return (
      <div className="text-destructive p-10 text-center">
        Resource not found or has no PDF link.
      </div>
    );

  // ── Layout ──────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className="bg-background text-foreground flex h-full flex-col overflow-hidden"
    >
      {/* Add Note dialog */}
      {isAddingNote && (
        <AddNoteModal
          defaultPage={currentPage}
          onConfirm={(page, text) => {
            addNote(page, text);
            setIsAddingNote(false);
          }}
          onCancel={() => setIsAddingNote(false)}
        />
      )}

      {/* Header */}
      <ViewerHeader
        material={material}
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        isBookmarked={isBookmarked}
        panelOpen={panelOpen}
        notes={notes}
        isFullScreen={isFullScreen}
        rotation={rotation}
        orientation={orientation}
        onBack={() => router.back()}
        onPrevPage={goToPrev}
        onNextPage={goToNext}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onToggleBookmark={toggleBookmark}
        onTogglePanel={togglePanelOpen}
        onAddNote={() => setIsAddingNote(true)}
        onToggleFullScreen={toggleFullScreen}
        onSwapOrientation={handleSwapOrientation}
        onOrientationChange={setOrientation}
      />

      {/* Pending highlight popover */}
      {pendingHighlight && (
        <HighlightPopover
          pendingHighlight={pendingHighlight}
          onSave={saveHighlight}
          onClose={() => {
            setPendingHighlight(null);
          }}
        />
      )}

      {/* Body: PDF + resizable notes sidebar */}
      <ResizablePanelGroup
        ref={groupRef}
        id="pdf-viewer-layout-v2"
        orientation="horizontal"
        className="min-h-0 w-full flex-1"
      >
        <ResizablePanel
          id="panel-pdf"
          defaultSize={75}
          minSize={20}
          className="bg-muted/30 relative min-w-0"
        >
          <PDFDisplay
            pdfUrl={material.pdfUrl}
            pdfLoading={pdfLoading}
            pdfError={pdfError}
            numPages={numPages}
            containerRef={containerRef}
            pageRefs={pageRefs}
            pageWidth={pageWidth}
            rotation={rotation}
            areaSelectionMode={areaSelectionMode}
            notes={notes}
            drawStart={drawStart}
            drawCurrent={drawCurrent}
            onLoadSuccess={(n) => {
              setNumPages(n);
              setPdfLoading(false);
            }}
            onLoadError={(err) => {
              toast.error('Failed to load the PDF. Please try again or contact your teacher.');
              setPdfLoading(false);
              setPdfError(true);
            }}
            onTextSelection={handleTextSelection}
            onPageMouseDown={onPageMouseDown}
            onPageMouseMove={onPageMouseMove}
            onPageMouseUp={onPageMouseUp}
          />
        </ResizablePanel>

        <ResizableHandle id="handle-notes" withHandle />

        <ResizablePanel
          ref={notesPanelRef}
          id="panel-notes"
          defaultSize={25}
          minSize={notesMinSize}
          onExpand={() => setPanelOpen(true)}
          className="bg-card flex min-w-0 flex-col overflow-hidden"
        >
          <div className="flex h-full flex-col overflow-hidden">
            <NotesSidebar
              notes={notes}
              onClose={togglePanelOpen}
              deleteNote={deleteNote}
              updateNote={updateNote}
              jumpToAnnotation={jumpToAnnotation}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
