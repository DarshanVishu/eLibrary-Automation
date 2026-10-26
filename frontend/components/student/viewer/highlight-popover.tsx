import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VIEWER_COLORS } from '@/lib/constants/viewer';
import { HighlightRect } from '@/lib/types/viewer';
import React from 'react';

interface HighlightPopoverProps {
  pendingHighlight: {
    page: number;
    type: 'highlight' | 'area';
    rects: HighlightRect[];
    text?: string;
    position: { x: number; y: number };
  };
  onSave: (colorName: string) => void;
  onClose: () => void;
}

export function HighlightPopover({ pendingHighlight, onSave, onClose }: HighlightPopoverProps) {
  return (
    <div
      id="highlight-popover"
      className="bg-card text-card-foreground border-border fixed z-[300] flex items-center gap-2 rounded-lg border p-2 shadow-lg"
      style={{ left: pendingHighlight.position.x, top: pendingHighlight.position.y }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span className="text-muted-foreground mr-1 px-1 text-xs font-semibold">Color:</span>
      {VIEWER_COLORS.map((c) => (
        <button
          key={c.name}
          className="h-6 w-6 cursor-pointer rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110"
          style={{ backgroundColor: c.rgb }}
          onClick={() => onSave(c.name)}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      ))}
      <div className="bg-border mx-1 h-6 w-px" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted text-muted-foreground rounded p-1"
            aria-label="Dismiss highlight"
            onClick={() => {
              onClose();
              window.getSelection()?.removeAllRanges();
            }}
          >
            <Icon name="close" size="sm" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Dismiss</TooltipContent>
      </Tooltip>
    </div>
  );
}
