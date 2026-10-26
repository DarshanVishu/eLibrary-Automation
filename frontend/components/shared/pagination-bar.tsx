'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/components/ui/utils';
import * as React from 'react';

interface PaginationBarProps {
  /** 0-indexed current page */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Called with the new 0-indexed page number */
  onPageChange: (page: number) => void;
  /** Optional: "Showing X–Y of Z items" label rendered on the left */
  label?: string;
  className?: string;
}

/**
 * Shared pagination bar used across admin, teacher and student pages.
 *
 * Layout:
 *   [label text]  [‹]  [input / totalPages]  [›]
 *
 * The centre input is editable — type a page number and press Enter (or blur)
 * to jump directly to that page. It falls back gracefully for invalid input.
 */
export function PaginationBar({
  page,
  totalPages,
  onPageChange,
  label,
  className,
}: PaginationBarProps) {
  // Local draft for the input value while the user is typing
  const [draft, setDraft] = React.useState<string>(String(page + 1));

  // Keep draft in sync when the page changes externally (filter changes, etc.)
  React.useEffect(() => {
    setDraft(String(page + 1));
  }, [page]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed - 1);
    } else {
      // reset to current page if input is invalid
      setDraft(String(page + 1));
    }
  };

  return (
    <div
      className={cn(
        'border-border flex items-center justify-between border-t px-5 py-3',
        className,
      )}
    >
      {/* Left — range label */}
      {label ? <p className="text-muted-foreground text-xs font-medium">{label}</p> : <span />}

      {/* Right — navigation controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <Icon name="chevron_left" size="sm" />
        </Button>

        {/* Page jump input */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            aria-label="Go to page"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(draft);
              if (e.key === 'Escape') setDraft(String(page + 1));
            }}
            onBlur={() => commit(draft)}
            className={cn(
              'border-input bg-background text-foreground h-8 w-10 rounded-md border text-center text-xs font-medium',
              'focus:ring-ring focus:ring-2 focus:ring-offset-1 focus:outline-none',
              'transition-colors',
            )}
          />
          <span className="text-muted-foreground text-xs font-medium">/ {totalPages}</span>
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <Icon name="chevron_right" size="sm" />
        </Button>
      </div>
    </div>
  );
}
