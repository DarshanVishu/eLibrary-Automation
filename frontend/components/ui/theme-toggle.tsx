'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from 'next-themes';
import * as React from 'react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground size-9 shrink-0"
      >
        <span className="size-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="text-muted-foreground hover:bg-accent hover:text-accent-foreground size-9 shrink-0"
    >
      <Icon name={isDark ? 'light_mode' : 'dark_mode'} size="md" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
