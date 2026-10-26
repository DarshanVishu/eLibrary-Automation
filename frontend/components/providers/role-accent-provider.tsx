'use client';

import { RoleContext, type Role } from '@/lib/context/role-context';
import { useTheme } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';

export { useRole } from '@/lib/context/role-context';

interface RoleTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
}

const ROLE_COLORS: Record<Role, RoleTheme> = {
  admin: {
    light: {
      '--primary': 'oklch(0.55 0.16 260)',
      '--primary-foreground': 'oklch(0.98 0.01 260)',
      '--accent': 'oklch(0.92 0.02 260)',
      '--accent-foreground': 'oklch(0.35 0.12 260)',
      '--ring': 'oklch(0.55 0.16 260)',
      '--sidebar-primary': 'oklch(0.55 0.16 260)',
      '--sidebar-primary-foreground': 'oklch(0.98 0.01 260)',
      '--sidebar-accent': 'oklch(0.92 0.02 260)',
      '--sidebar-accent-foreground': 'oklch(0.35 0.12 260)',
      '--sidebar-ring': 'oklch(0.55 0.16 260)',
      '--chart-1': 'oklch(0.55 0.16 260)',
      '--chart-2': 'oklch(0.45 0.14 260)',
      '--chart-3': 'oklch(0.35 0.12 260)',
      '--chart-4': 'oklch(0.65 0.12 260)',
      '--chart-5': 'oklch(0.75 0.08 260)',
    },
    dark: {
      '--primary': 'oklch(0.70 0.12 260)',
      '--primary-foreground': 'oklch(0.15 0.02 260)',
      '--accent': 'oklch(0.25 0.05 260)',
      '--accent-foreground': 'oklch(0.90 0.03 260)',
      '--ring': 'oklch(0.70 0.12 260)',
      '--sidebar-primary': 'oklch(0.70 0.12 260)',
      '--sidebar-primary-foreground': 'oklch(0.15 0.02 260)',
      '--sidebar-accent': 'oklch(0.25 0.05 260)',
      '--sidebar-accent-foreground': 'oklch(0.90 0.03 260)',
      '--sidebar-ring': 'oklch(0.70 0.12 260)',
      '--chart-1': 'oklch(0.70 0.12 260)',
      '--chart-2': 'oklch(0.60 0.14 260)',
      '--chart-3': 'oklch(0.50 0.16 260)',
      '--chart-4': 'oklch(0.80 0.10 260)',
      '--chart-5': 'oklch(0.90 0.05 260)',
    },
  },
  teacher: {
    light: {
      '--primary': 'oklch(0.58 0.14 165)',
      '--primary-foreground': 'oklch(0.98 0.01 165)',
      '--accent': 'oklch(0.94 0.03 165)',
      '--accent-foreground': 'oklch(0.30 0.10 165)',
      '--ring': 'oklch(0.58 0.14 165)',
      '--sidebar-primary': 'oklch(0.58 0.14 165)',
      '--sidebar-primary-foreground': 'oklch(0.98 0.01 165)',
      '--sidebar-accent': 'oklch(0.94 0.03 165)',
      '--sidebar-accent-foreground': 'oklch(0.30 0.10 165)',
      '--sidebar-ring': 'oklch(0.58 0.14 165)',
      '--chart-1': 'oklch(0.58 0.14 165)',
      '--chart-2': 'oklch(0.48 0.12 165)',
      '--chart-3': 'oklch(0.38 0.10 165)',
      '--chart-4': 'oklch(0.68 0.10 165)',
      '--chart-5': 'oklch(0.78 0.08 165)',
    },
    dark: {
      '--primary': 'oklch(0.72 0.11 165)',
      '--primary-foreground': 'oklch(0.15 0.02 165)',
      '--accent': 'oklch(0.22 0.06 165)',
      '--accent-foreground': 'oklch(0.92 0.04 165)',
      '--ring': 'oklch(0.72 0.11 165)',
      '--sidebar-primary': 'oklch(0.72 0.11 165)',
      '--sidebar-primary-foreground': 'oklch(0.15 0.02 165)',
      '--sidebar-accent': 'oklch(0.22 0.06 165)',
      '--sidebar-accent-foreground': 'oklch(0.92 0.04 165)',
      '--sidebar-ring': 'oklch(0.72 0.11 165)',
      '--chart-1': 'oklch(0.72 0.11 165)',
      '--chart-2': 'oklch(0.62 0.13 165)',
      '--chart-3': 'oklch(0.52 0.15 165)',
      '--chart-4': 'oklch(0.82 0.09 165)',
      '--chart-5': 'oklch(0.92 0.05 165)',
    },
  },
  student: {
    light: {
      '--primary': 'oklch(0.68 0.16 78)',
      '--primary-foreground': 'oklch(0.20 0.05 78)',
      '--accent': 'oklch(0.95 0.04 78)',
      '--accent-foreground': 'oklch(0.40 0.15 78)',
      '--ring': 'oklch(0.68 0.16 78)',
      '--sidebar-primary': 'oklch(0.68 0.16 78)',
      '--sidebar-primary-foreground': 'oklch(0.20 0.05 78)',
      '--sidebar-accent': 'oklch(0.95 0.04 78)',
      '--sidebar-accent-foreground': 'oklch(0.40 0.15 78)',
      '--sidebar-ring': 'oklch(0.68 0.16 78)',
      '--chart-1': 'oklch(0.68 0.16 78)',
      '--chart-2': 'oklch(0.58 0.14 78)',
      '--chart-3': 'oklch(0.48 0.12 78)',
      '--chart-4': 'oklch(0.78 0.12 78)',
      '--chart-5': 'oklch(0.88 0.08 78)',
    },
    dark: {
      '--primary': 'oklch(0.78 0.14 78)',
      '--primary-foreground': 'oklch(0.15 0.05 78)',
      '--accent': 'oklch(0.28 0.08 78)',
      '--accent-foreground': 'oklch(0.94 0.06 78)',
      '--ring': 'oklch(0.78 0.14 78)',
      '--sidebar-primary': 'oklch(0.78 0.14 78)',
      '--sidebar-primary-foreground': 'oklch(0.15 0.05 78)',
      '--sidebar-accent': 'oklch(0.28 0.08 78)',
      '--sidebar-accent-foreground': 'oklch(0.94 0.06 78)',
      '--sidebar-ring': 'oklch(0.78 0.14 78)',
      '--chart-1': 'oklch(0.78 0.14 78)',
      '--chart-2': 'oklch(0.68 0.16 78)',
      '--chart-3': 'oklch(0.58 0.18 78)',
      '--chart-4': 'oklch(0.88 0.10 78)',
      '--chart-5': 'oklch(0.95 0.05 78)',
    },
  },
};

interface RoleAccentProviderProps {
  children: ReactNode;
  role?: Role | null;
}

export function RoleAccentProvider({ children, role = null }: RoleAccentProviderProps) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!role || !resolvedTheme) return;
    const isDark = resolvedTheme === 'dark';
    const colors = ROLE_COLORS[role][isDark ? 'dark' : 'light'];
    const root = document.documentElement;
    root.setAttribute('data-role', role);
    Object.entries(colors).forEach(([key, value]) => root.style.setProperty(key, value));
    return () => {
      root.removeAttribute('data-role');
      Object.entries(colors).forEach(([key]) => root.style.removeProperty(key));
    };
  }, [role, resolvedTheme]);

  const colors = role ? ROLE_COLORS[role][resolvedTheme === 'dark' ? 'dark' : 'light'] : {};

  return <RoleContext.Provider value={{ role, colors }}>{children}</RoleContext.Provider>;
}
