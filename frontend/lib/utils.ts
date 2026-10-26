import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indian locale
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number (10 digits)
 * @param phone - Phone number to validate
 * @returns Boolean indicating if phone is valid
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Generate slug from string
 * @param text - Text to slugify
 * @returns Slugified string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Math.floor((new Date().getTime() - d.getTime()) / 60000);

  if (diff < 60) {
    const mins = Math.max(1, diff);
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  }

  if (diff < 1440) {
    const hrs = Math.floor(diff / 60);
    return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  }

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatTypeLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short' });
}

export function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDelta(delta: number, suffix: string): string {
  if (delta > 0) return `+${delta} ${suffix}`;
  if (delta < 0) return `${delta} ${suffix}`;
  return `0 ${suffix}`;
}

/**
 * Format errors into human-friendly messages
 */
export function getFriendlyError(message: string, status?: number): string {
  const msg = message.toLowerCase();

  if (msg.includes('fetch failed') || msg.includes('etimedout') || msg.includes('network')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please double-check and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for a verification link.';
  }
  if (msg.includes('user not found') || status === 404) {
    return 'No account found with that email address.';
  }
  if (msg.includes('too many requests') || status === 429) {
    return 'Too many login attempts. Please wait a few minutes before trying again.';
  }
  if (msg.includes('email') && msg.includes('invalid')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('password') && (msg.includes('short') || msg.includes('weak'))) {
    return 'Password is too short. It must be at least 6 characters.';
  }
  if (msg.includes('account') && msg.includes('disabled')) {
    return 'This account has been disabled. Please contact your administrator.';
  }

  // Fallback — strip raw technical details
  return 'Sign in failed. Please try again or contact your administrator.';
}

/**
 * Format grade access list into a readable label (e.g. "Grade 9", "Grades 9–10").
 * An empty or null access list means the material is unrestricted → "All Grades".
 */
export function formatGradeLabel(access: any[] | null | undefined): string {
  if (!access || access.length === 0) return 'All Grades';
  const grades = Array.from(
    new Set(access.map((g) => g?.grade).filter((g): g is number => typeof g === 'number')),
  ).sort((a, b) => a - b);

  if (grades.length === 0) return 'All Grades';
  if (grades.length === 1) return `Grade ${grades[0]}`;
  const first = grades[0];
  const last = grades[grades.length - 1];
  return `Grades ${first}–${last}`;
}
