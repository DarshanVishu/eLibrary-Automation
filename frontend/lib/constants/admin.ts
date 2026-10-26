export const ADMIN_ROUTES = {
  dashboard: '/admin',
  analytics: '/admin/analytics',
  approvals: '/admin/approvals',
  library: '/admin/library',
  users: '/admin/users',
  settings: '/admin/settings',
} as const;

export const ADMIN_CHART_COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // rose-red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#a3e635', // lime
] as const;

export const DEFAULT_GRADE_ACCESS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
