/**
 * WHY THIS FILE WAS REFACTORED (Fix #3)
 *
 * Previously this imported ArrowLeft, Bookmark, PanelLeftOpen, PanelLeftClose,
 * ChevronLeft, ChevronRight, ZoomIn, ZoomOut from student-icons.tsx — a file
 * that did nothing but re-export thin wrappers around the shared <Icon>
 * component.  That indirection added a pointless dependency chain:
 *
 *   viewer-header → student-icons → Icon
 *
 * instead of the straightforward:
 *
 *   viewer-header → Icon
 *
 * student-icons.tsx existed as a legacy shim from when the viewer was built
 * with Lucide icons.  After migrating to the shared <Icon> component, those
 * named wrappers became pure noise — identically named functions that forward
 * all props unchanged.  Any new developer reading viewer-header would have to
 * trace through student-icons to understand what is actually rendered.
 *
 * Fix: import <Icon> directly and pass the icon name inline — identical
 * runtime behaviour, zero extra indirection.
 */
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MaterialData, NoteRecord } from '@/lib/types/viewer';

export type PDFOrientation = 'portrait' | 'landscape' | 'landscape-flipped';

interface ViewerHeaderProps {
  material: MaterialData;
  currentPage: number;
  numPages: number;
  scale: number;
  isBookmarked: boolean;
  panelOpen: boolean;
  notes: NoteRecord[];
  isFullScreen?: boolean;
  rotation?: number;
  orientation?: PDFOrientation;
  onBack: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleBookmark: () => void;
  onTogglePanel: () => void;
  onAddNote: () => void;
  onToggleFullScreen?: () => void;
  onSwapOrientation?: () => void;
  onOrientationChange?: (orientation: PDFOrientation) => void;
}

export function ViewerHeader({
  material,
  currentPage,
  numPages,
  scale,
  isBookmarked,
  panelOpen,
  notes,
  isFullScreen,
  rotation = 0,
  orientation = 'portrait',
  onBack,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onToggleBookmark,
  onTogglePanel,
  onAddNote,
  onToggleFullScreen,
  onSwapOrientation,
  onOrientationChange,
}: ViewerHeaderProps) {
  return (
    <div className="border-border bg-card z-20 flex-shrink-0 border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: back + title */}
        <div className="flex min-w-0 items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="flex-shrink-0 rounded-lg"
                aria-label="Go back"
              >
                <Icon name="back" size="md" className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Go back</TooltipContent>
          </Tooltip>
          <div className="border-border h-8 border-l" />
          <div className="min-w-0">
            <h3 className="text-foreground truncate text-sm font-bold">{material.title}</h3>
            <p className="text-muted-foreground text-xs">
              {material.grade > 0 ? `Grade ${material.grade}` : 'All Grades'} · {material.subject}
            </p>
          </div>
        </div>

        {/* Centre: page navigation + zoom */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevPage}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <Icon name="chevron_left" size="sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Previous page</TooltipContent>
          </Tooltip>
          <span className="text-muted-foreground min-w-[80px] text-center text-xs tabular-nums">
            {currentPage} / {numPages || '…'}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNextPage}
                disabled={currentPage >= numPages}
                aria-label="Next page"
              >
                <Icon name="chevron_right" size="sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Next page</TooltipContent>
          </Tooltip>
          <div className="border-border mx-2 h-5 border-l" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
                <Icon name="zoom_out" size="sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom out</TooltipContent>
          </Tooltip>
          <span className="text-muted-foreground min-w-[44px] text-center text-xs tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
                <Icon name="zoom_in" size="sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom in</TooltipContent>
          </Tooltip>

          <div className="border-border mx-2 h-5 border-l" />
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Swap orientation">
                    <Icon name="screen_rotation" size="sm" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Swap orientation</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="center" className="w-52">
              <DropdownMenuItem
                onClick={() => onOrientationChange?.('portrait')}
                className={
                  orientation === 'portrait' ? 'bg-accent text-accent-foreground font-medium' : ''
                }
              >
                <Icon name="crop_portrait" size="sm" className="mr-2" />
                <span>Portrait (default)</span>
                {orientation === 'portrait' && (
                  <Icon name="check" size="sm" className="text-primary ml-auto" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOrientationChange?.('landscape')}
                className={
                  orientation === 'landscape' ? 'bg-accent text-accent-foreground font-medium' : ''
                }
              >
                <Icon name="crop_landscape" size="sm" className="mr-2" />
                <span>Landscape</span>
                {orientation === 'landscape' && (
                  <Icon name="check" size="sm" className="text-primary ml-auto" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOrientationChange?.('landscape-flipped')}
                className={
                  orientation === 'landscape-flipped'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : ''
                }
              >
                <Icon name="screen_rotation" size="sm" className="mr-2" />
                <span>Landscape (flipped)</span>
                {orientation === 'landscape-flipped' && (
                  <Icon name="check" size="sm" className="text-primary ml-auto" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullScreen}
                aria-label={isFullScreen ? 'Exit full screen' : 'Full screen'}
              >
                <Icon name={isFullScreen ? 'fullscreen_exit' : 'fullscreen'} size="sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isFullScreen ? 'Exit full screen' : 'Full screen'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Add Note, Bookmark, Notes panel */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onAddNote}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium shadow-sm"
          >
            <Icon name="sticky_note" size="sm" />
            <span className="hidden sm:inline">Add Note</span>
          </Button>

          <Button
            variant={isBookmarked ? 'outline' : 'ghost'}
            onClick={onToggleBookmark}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${isBookmarked ? 'border-primary text-primary' : ''}`}
          >
            <Icon
              name="bookmark"
              size="sm"
              filled={isBookmarked}
              className={isBookmarked ? 'text-primary' : ''}
            />
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
          </Button>

          <div className="border-border h-6 border-l" />

          <Button
            variant={panelOpen ? 'outline' : 'ghost'}
            onClick={onTogglePanel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm"
          >
            <Icon name={panelOpen ? 'panel_left_close' : 'panel_left_open'} size="sm" />
            <span className="hidden sm:inline">Notes</span>
            {notes.length > 0 && (
              <span className="bg-primary text-primary-foreground ml-0.5 rounded-full px-1.5 text-[10px] leading-4 font-bold">
                {notes.length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
