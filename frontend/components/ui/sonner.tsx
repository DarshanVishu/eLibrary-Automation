'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: '!font-sans',
          title: '!font-sans',
          description: '!font-sans',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--success)',
          '--success-text': 'var(--success-foreground)',
          '--success-border': 'var(--success-border)',
          '--warning-bg': 'var(--warning)',
          '--warning-text': 'var(--warning-foreground)',
          '--warning-border': 'var(--warning-border)',
          '--error-bg': 'var(--destructive)',
          '--error-text': 'var(--destructive-foreground)',
          '--error-border': 'var(--border)',
          '--info-bg': 'var(--info)',
          '--info-text': 'var(--info-foreground)',
          '--info-border': 'var(--info-border)',
          '--border-radius': 'var(--radius)',
          '--shadow': 'var(--shadow-lg)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
