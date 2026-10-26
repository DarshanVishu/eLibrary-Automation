import type { IconName } from '@/components/ui/icon';

export const GRADE_MOTTOS: Record<number, string> = {
  1: 'Every big journey starts with one small step',
  2: 'Reading opens doors to amazing worlds',
  3: 'Curious minds discover wonderful things',
  4: 'knowledge is your superpower',
  5: 'Dream big, learn bigger',
  6: 'You are leveling up — keep going',
  7: 'Challenges make you stronger',
  8: 'Think deep, aim high',
  9: 'Future leader in the making',
  10: 'Board exams? You have got this',
};

export interface ProgramItem {
  icon: IconName;
  label: string;
  desc: string;
}

export const PROGRAMS: ProgramItem[] = [
  {
    icon: 'books',
    label: 'Rich Study Library',
    desc: 'Access thousands of textbooks, guides, and reference books curated for every grade and subject.',
  },
  {
    icon: 'help_circle',
    label: 'Practice & Assessment',
    desc: 'Question banks and mock tests aligned to the curriculum, so you can prepare with confidence.',
  },
  {
    icon: 'bar_chart',
    label: 'Track Your Progress',
    desc: 'Monitor reading streaks, completed materials, and bookmarks — all in one dashboard.',
  },
];

export interface TestimonialItem {
  name: string;
  grade: number;
  text: string;
  stars: number;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'Priya Das',
    grade: 5,
    text: 'My child reads every night now! The library is colorful and so easy to use.',
    stars: 5,
  },
  {
    name: 'Ramesh Nair',
    grade: 7,
    text: 'Fantastic platform! Found exactly the books needed for board exam preparation.',
    stars: 5,
  },
  {
    name: 'Sunitha Raj',
    grade: 3,
    text: 'The subject shortcuts make navigation super simple. Love this app!',
    stars: 4,
  },
];

export interface FeatureItem {
  icon: IconName;
  label: string;
}

export const FEATURES: FeatureItem[] = [
  { icon: 'books', label: 'All subjects, all grades in one place' },
  { icon: 'tune', label: 'Filter and find exactly what you need' },
  { icon: 'bar_chart', label: 'Progress tracking built right in' },
];

export const CHART_COLORS = [
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
];
