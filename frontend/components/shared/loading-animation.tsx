'use client';

import { Dots_v4 } from '@/components/shared/dots-animation';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface LoadingProps {
  message?: string;
  subtext?: string;
  className?: string;
}

export function FullScreenLoading({ className }: LoadingProps) {
  return (
    <div
      className={cn(
        'bg-background text-foreground flex min-h-screen items-center justify-center',
        className,
      )}
    >
      <Dots_v4 />
    </div>
  );
}

export function FullScreenRedirectLoading({ className }: LoadingProps) {
  return (
    <div
      className={cn(
        'bg-background text-foreground flex min-h-screen items-center justify-center',
        className,
      )}
    >
      <Dots_v4 />
    </div>
  );
}

export function InlineLoading({ className }: LoadingProps) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center justify-center gap-2 text-sm',
        className,
      )}
    >
      <Dots_v4 />
    </div>
  );
}
