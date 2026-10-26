'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';

const ResizablePanelGroup = React.forwardRef<
  ResizablePrimitive.GroupImperativeHandle,
  ResizablePrimitive.GroupProps
>(({ className, ...props }, ref) => (
  <ResizablePrimitive.Group
    groupRef={ref}
    data-slot="resizable-panel-group"
    className={cn('flex h-full w-full aria-[orientation=vertical]:flex-col', className)}
    {...props}
  />
));
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

const ResizablePanel = React.forwardRef<ResizablePrimitive.PanelImperativeHandle, any>(
  ({ onCollapse, onExpand, onResize: onResizeProp, ...props }, ref) => {
    const onResize = React.useCallback(
      (
        size: ResizablePrimitive.PanelSize,
        id?: string | number,
        prevSize?: ResizablePrimitive.PanelSize,
      ) => {
        if (onCollapse && size.asPercentage === 0 && (prevSize?.asPercentage ?? 1) > 0) {
          onCollapse();
        } else if (onExpand && size.asPercentage > 0 && (prevSize?.asPercentage ?? 0) === 0) {
          onExpand();
        }
        if (onResizeProp) {
          onResizeProp(size, id, prevSize);
        }
      },
      [onCollapse, onExpand, onResizeProp],
    );

    return (
      <ResizablePrimitive.Panel
        panelRef={ref}
        onResize={onResize}
        data-slot="resizable-panel"
        {...props}
      />
    );
  },
);
ResizablePanel.displayName = 'ResizablePanel';

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  ResizablePrimitive.SeparatorProps & {
    withHandle?: boolean;
  }
>(({ withHandle, className, ...props }, ref) => (
  <ResizablePrimitive.Separator
    elementRef={ref as React.Ref<HTMLDivElement>}
    data-slot="resizable-handle"
    className={cn(
      // Invisible 8px wide hit area with the 1px line centred inside
      'focus-visible:ring-ring group relative flex w-2 cursor-col-resize items-center justify-center',
      'focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden',
      // Horizontal orientation overrides
      'aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize',
      '[&[aria-orientation=horizontal]>div.line]:h-px [&[aria-orientation=horizontal]>div.line]:w-full',
      '[&[aria-orientation=horizontal]>div.grip]:rotate-90',
      className,
    )}
    {...props}
  >
    {/* Visible 1 px rule */}
    <div
      className={cn(
        'line bg-border absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors',
        'group-hover:bg-primary/40 group-active:bg-primary/60',
      )}
    />

    {/* Pill grip — only when withHandle */}
    {withHandle && (
      <div
        className={cn(
          'grip bg-card border-border relative z-10 flex h-8 w-3.5 flex-col items-center justify-center gap-[3px]',
          'rounded-full border shadow-sm transition-all',
          'group-hover:border-primary/40 group-hover:shadow-md group-active:scale-95',
        )}
      >
        {/* Three dot indicators */}
        <span className="bg-muted-foreground/50 group-hover:bg-primary/70 h-0.5 w-0.5 rounded-full transition-colors" />
        <span className="bg-muted-foreground/50 group-hover:bg-primary/70 h-0.5 w-0.5 rounded-full transition-colors" />
        <span className="bg-muted-foreground/50 group-hover:bg-primary/70 h-0.5 w-0.5 rounded-full transition-colors" />
      </div>
    )}
  </ResizablePrimitive.Separator>
));
ResizableHandle.displayName = 'ResizableHandle';

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
