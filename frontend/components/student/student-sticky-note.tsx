import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

export interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  content: string;
  color: NoteColor;
  page: number;
  createdAt: string;
}

// Shared note metadata for the reusable one-card-one-concept note card.
export interface StudentNoteContextLink {
  label: string;
  href: string;
}

export interface StudentNoteCardProps {
  id: string;
  title?: string;
  body: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  contextLinks?: StudentNoteContextLink[];
  sourceLabel?: string;
  onClick?: () => void;
}

export const NOTE_COLOR_MAP: Record<
  NoteColor,
  {
    header: string;
    body: string;
    border: string;
    textarea: string;
    dot: string;
    label: string;
  }
> = {
  yellow: {
    header: 'bg-yellow-300',
    body: 'bg-yellow-50',
    border: 'border-yellow-300',
    textarea: 'bg-yellow-50 placeholder-yellow-400',
    dot: 'bg-yellow-400',
    label: 'Yellow',
  },
  pink: {
    header: 'bg-pink-300',
    body: 'bg-pink-50',
    border: 'border-pink-300',
    textarea: 'bg-pink-50 placeholder-pink-400',
    dot: 'bg-pink-400',
    label: 'Pink',
  },
  blue: {
    header: 'bg-blue-300',
    body: 'bg-blue-50',
    border: 'border-blue-300',
    textarea: 'bg-blue-50 placeholder-blue-400',
    dot: 'bg-blue-400',
    label: 'Blue',
  },
  green: {
    header: 'bg-green-300',
    body: 'bg-green-50',
    border: 'border-green-300',
    textarea: 'bg-green-50 placeholder-green-400',
    dot: 'bg-green-400',
    label: 'Green',
  },
  orange: {
    header: 'bg-orange-300',
    body: 'bg-orange-50',
    border: 'border-orange-300',
    textarea: 'bg-orange-50 placeholder-orange-400',
    dot: 'bg-orange-400',
    label: 'Orange',
  },
  purple: {
    header: 'bg-purple-300',
    body: 'bg-purple-50',
    border: 'border-purple-300',
    textarea: 'bg-purple-50 placeholder-purple-400',
    dot: 'bg-purple-400',
    label: 'Purple',
  },
};

export function StudentNoteCard({
  title,
  body,
  tags = [],
  createdAt,
  updatedAt,
  contextLinks = [],
  sourceLabel,
  onClick,
}: StudentNoteCardProps) {
  const created = new Date(createdAt);
  const updated = updatedAt ? new Date(updatedAt) : null;

  return (
    <Card
      data-slot="student-note-card"
      onClick={onClick}
      className={`group bg-card/80 border-dashed transition-colors ${
        onClick ? 'hover:border-primary/60 hover:bg-card cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">{title || 'Untitled note'}</CardTitle>
            <CardDescription className="text-xs">
              <span className="inline-flex items-center gap-1">
                <Icon name="sticky_note" size="xs" className="text-muted-foreground" />
                <span>
                  {created.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {updated && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>
                      Updated{' '}
                      {updated.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </span>
            </CardDescription>
          </div>
          {sourceLabel && (
            <Badge variant="outline" className="mt-1 shrink-0 text-[10px]">
              {sourceLabel}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-line">{body}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="inline-flex items-center gap-1 rounded-full border-dashed px-2 py-0.5 text-[10px]"
              >
                <Icon name="tag" size="xs" className="text-muted-foreground" />
                <span>{tag}</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {contextLinks.length > 0 && (
        <CardFooter className="flex flex-wrap gap-2 border-t border-dashed pt-3">
          {contextLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-primary inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              <Icon name="article" size="xs" className="text-primary" />
              <span className="line-clamp-1">{link.label}</span>
            </Link>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}

interface StickyNoteWidgetProps {
  note: StickyNoteData;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function StickyNoteWidget({
  note,
  onUpdate,
  onDelete,
  onPositionChange,
  containerRef,
}: StickyNoteWidgetProps) {
  const [minimized, setMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const colors = NOTE_COLOR_MAP[note.color];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!noteRef.current || !containerRef.current) return;
      const noteRect = noteRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - noteRect.left,
        y: e.clientY - noteRect.top,
      };
      setIsDragging(true);
    },
    [containerRef],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.current.x;
      const newY = e.clientY - containerRect.top - dragOffset.current.y;
      onPositionChange(note.id, Math.max(0, newX), Math.max(0, newY));
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, note.id, onPositionChange, containerRef]);

  return (
    <div
      ref={noteRef}
      className={`absolute z-30 overflow-hidden rounded-xl border-2 ${colors.border} shadow-xl transition-shadow duration-150 select-none`}
      style={{
        left: note.x,
        top: note.y,
        width: 220,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.25)' : '4px 6px 16px rgba(0,0,0,0.15)',
        transform: `rotate(${note.id.charCodeAt(0) % 3 === 0 ? '-1.2deg' : note.id.charCodeAt(0) % 3 === 1 ? '1deg' : '0deg'})`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header / Drag handle */}
      <div
        className={`${colors.header} flex cursor-grab items-center justify-between px-3 py-2 active:cursor-grabbing`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1.5">
          <Icon name="sticky_note" className="h-3.5 w-3.5 text-white/80" />
          <Icon name="menu" className="h-4 w-4 text-white/60" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
            }}
            className="rounded p-0.5 transition-colors hover:bg-white/30"
            title={minimized ? 'Expand' : 'Minimize'}
          >
            <Icon name="delete" className="h-3.5 w-3.5 text-white" />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="rounded p-0.5 transition-colors hover:bg-white/30"
            title="Delete note"
          >
            <Icon name="close" className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div
          className={`${colors.body} relative`}
          style={{
            backgroundImage: `repeating-linear-gradient(
              transparent,
              transparent 23px,
              rgba(0,0,0,0.06) 23px,
              rgba(0,0,0,0.06) 24px
            )`,
            backgroundPositionY: '8px',
          }}
        >
          {/* Red margin line */}
          <div className="pointer-events-none absolute top-0 bottom-0 left-7 w-px bg-red-300/50" />
          <textarea
            className={`text-foreground h-28 w-full resize-none pt-1.5 pr-2 pb-2 pl-9 text-xs outline-none ${colors.textarea} font-mono leading-6`}
            placeholder="Type your note here..."
            value={note.content}
            onChange={(e) => onUpdate(note.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ background: 'transparent' }}
          />
          <div className="px-3 pb-2 text-right">
            <span className="text-muted-foreground text-xs">
              {new Date(note.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
