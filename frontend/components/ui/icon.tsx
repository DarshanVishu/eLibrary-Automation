/**
 * Icon — Material Symbols Rounded wrapper
 *
 * Uses the variable font's FILL axis to switch between outline (0) and filled (1).
 * All icon names use Material Symbols ligature strings (snake_case).
 *
 * Usage:
 *   <Icon name="home" />                    // outline, 24px
 *   <Icon name="home" filled />             // filled
 *   <Icon name="notifications" size="lg" /> // 24px
 *   <Icon name="settings" size="sm" filled={isActive} style={{ color: '#7C3AED' }} />
 */
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

// ─── Canonical icon name map ───────────────────────────────────────────────
// Maps friendly alias → Material Symbols ligature string.
// Add new icons here as needed.
export const ICONS = {
  // Navigation
  home: 'home',
  back: 'arrow_back',
  forward: 'arrow_forward',
  menu: 'menu',
  close: 'close',
  chevron_right: 'chevron_right',
  chevron_left: 'chevron_left',
  arrow_back: 'arrow_back',
  arrow_drop_down: 'arrow_drop_down',
  arrow_drop_up: 'arrow_drop_up',
  keyboard_arrow_down: 'keyboard_arrow_down',
  more_vert: 'more_vert',

  // Action
  add: 'add',
  save: 'save',
  edit: 'edit',
  delete: 'delete',
  download: 'download',
  upload: 'upload',
  search: 'search',
  filter: 'filter_list',
  check: 'check',
  close_small: 'close_small',

  // Content / Library
  library: 'local_library',
  book: 'menu_book',
  books: 'library_books',
  description: 'description',
  article: 'article',

  // People / Auth
  person: 'person',
  people: 'group',
  school: 'school',
  student: 'person',
  teacher: 'menu_book',
  admin: 'manage_accounts',
  shield: 'shield',
  verified_user: 'verified_user',
  person_add: 'person_add',
  group_add: 'group_add',
  person_check: 'how_to_reg',
  person_off: 'person_off',
  construction: 'construction',
  logout: 'logout',
  login: 'login',
  mail: 'mail',
  lock: 'lock',
  lock_reset: 'lock_reset',
  bookmark: 'bookmark',

  // Status / Feedback
  check_circle: 'check_circle',
  cancel: 'cancel',
  error: 'error',
  warning: 'warning',
  info: 'info',
  pending: 'pending',
  schedule: 'schedule',
  spinner: 'progress_activity',
  visibility: 'visibility',
  visibility_off: 'visibility_off',
  notifications: 'notifications',
  notifications_off: 'notifications_off',
  sync: 'sync',

  // Data / Analytics
  bar_chart: 'bar_chart',
  bar_chart_2: 'bar_chart',
  analytics: 'analytics',
  trending_up: 'trending_up',
  trending_down: 'trending_down',
  pie_chart: 'pie_chart',

  // Media / Files
  image: 'image',
  file: 'draft',
  pdf: 'picture_as_pdf',
  preview: 'preview',
  folder_open: 'folder_open',

  // UI / Misc
  bell: 'notifications',
  settings: 'settings',
  approval: 'approval',
  campaign: 'campaign',
  send: 'send',
  check_box: 'check_box',
  eye: 'visibility',
  star: 'star',
  star_outline: 'star_outline',
  calendar: 'calendar_today',
  tag: 'label',
  mic: 'mic',
  chart: 'bar_chart',
  tune: 'tune',
  play_circle: 'play_circle',
  bookmark_border: 'bookmark_border',
  filter_list: 'filter_list',
  half_star: 'star_half',
  circle: 'radio_button_unchecked',
  grade: 'grade',
  refresh: 'refresh',
  new_releases: 'new_releases',
  workspace_premium: 'workspace_premium',
  emoji_people: 'emoji_people',

  // Custom student requested features
  sparkles: 'auto_awesome',
  help_circle: 'help',
  calculator: 'calculate',
  microscope: 'biotech',
  globe: 'public',
  laptop: 'laptop_mac',
  leaf: 'eco',
  languages: 'translate',
  scroll: 'history_edu',
  flame: 'local_fire_department',
  zap: 'bolt',
  trophy: 'emoji_events',
  rocket: 'rocket_launch',
  target: 'track_changes',
  sprout: 'grass',
  flower: 'local_florist',
  lightbulb: 'lightbulb',
  telescope: 'science',
  clock: 'schedule',
  zoom_in: 'zoom_in',
  zoom_out: 'zoom_out',
  highlighter: 'border_color',
  sticky_note: 'sticky_note_2',
  mouse_pointer: 'mouse',
  trash2: 'delete',
  panel_left_open: 'vertical_split',
  panel_left_close: 'vertical_split',
  light_mode: 'light_mode',
  dark_mode: 'dark_mode',
  phone: 'phone',
  bolt: 'bolt',
  fullscreen: 'fullscreen',
  fullscreen_exit: 'fullscreen_exit',
  screen_rotation: 'screen_rotation',
  rotate_right: 'rotate_right',
  rotate_left: 'rotate_left',
  crop_portrait: 'crop_portrait',
  crop_landscape: 'crop_landscape',

  // Subject icons
  sports: 'sports_handball',
  build: 'build',
} as const;

export type IconName = keyof typeof ICONS;

// ─── Size map ─────────────────────────────────────────────────────────────
const sizeClass: Record<string, string> = {
  xs: 'icon-xs',
  sm: 'icon-sm',
  md: 'icon-md',
  lg: 'icon-lg',
  xl: 'icon-xl',
  '2xl': 'icon-2xl',
};

// ─── Component ────────────────────────────────────────────────────────────
export interface IconProps {
  /** Icon name from the ICONS map */
  name: IconName;
  /** When true, renders FILL=1 (solid). When false/omitted, renders FILL=0 (outline). */
  filled?: boolean;
  /** Size preset. Defaults to 'lg' (24px). */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Optional CSS class names */
  className?: string;
  /** Inline styles (color, margin, etc.) */
  style?: CSSProperties;
  /** Aria label for accessibility */
  label?: string;
}

export function Icon({ name, filled = false, size = 'lg', className, style, label }: IconProps) {
  return (
    <span
      className={cn(
        'icon',
        sizeClass[size] ?? 'icon-lg',
        filled ? 'icon-filled' : 'icon-outline',
        className,
      )}
      style={style}
      aria-label={label}
      aria-hidden={!label}
      role={label ? 'img' : undefined}
    >
      {ICONS[name]}
    </span>
  );
}
