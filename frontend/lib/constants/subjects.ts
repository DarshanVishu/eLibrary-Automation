import type { IconName } from '@/components/ui/icon';

/**
 * Single source of truth for all subject metadata used across student pages.
 */
export interface SubjectConfig {
  key: string;
  label: string;
  shortLabel: string;
  iconName: IconName;
  /** Solid HEX colour — background for active state */
  color: string;
  /** Contrasting text colour for active state */
  textColor: string;
  /** Light pastel background for inactive / hover */
  lightBg: string;
  /** Tailwind classes: inactive pill */
  inactivePill: string;
  /** Tailwind classes: active pill */
  activePill: string;
}

export const SUBJECTS: SubjectConfig[] = [
  {
    key: 'Mathematics',
    label: 'Mathematics',
    shortLabel: 'Maths',
    iconName: 'calculator',
    color: '#F7C948',
    textColor: '#5B3B00',
    lightBg: '#FFF3CC',
    inactivePill: 'bg-[#FFF3CC] text-[#8B6A00] hover:bg-[#FFE999]',
    activePill: 'bg-[#F7C948] text-[#5B3B00]',
  },
  {
    key: 'Science',
    label: 'Science',
    shortLabel: 'Science',
    iconName: 'microscope',
    color: '#4CBFBF',
    textColor: '#ffffff',
    lightBg: '#D9F5F5',
    inactivePill: 'bg-[#D9F5F5] text-[#1A8F8F] hover:bg-[#B8ECEC]',
    activePill: 'bg-[#4CBFBF] text-white',
  },
  {
    key: 'English',
    label: 'English',
    shortLabel: 'English',
    iconName: 'book',
    color: '#F47BA8',
    textColor: '#ffffff',
    lightBg: '#FDEAF3',
    inactivePill: 'bg-[#FDEAF3] text-[#C04A7A] hover:bg-[#FBCFE5]',
    activePill: 'bg-[#F47BA8] text-white',
  },
  {
    key: 'Hindi',
    label: 'Hindi',
    shortLabel: 'Hindi',
    iconName: 'languages',
    color: '#E67E22',
    textColor: '#ffffff',
    lightBg: '#FDECD8',
    inactivePill: 'bg-[#FDECD8] text-[#A05010] hover:bg-[#FAD9B0]',
    activePill: 'bg-[#E67E22] text-white',
  },
  {
    key: 'Social Science',
    label: 'Social Science',
    shortLabel: 'Social',
    iconName: 'globe',
    color: '#5B9BD5',
    textColor: '#ffffff',
    lightBg: '#DFF0FB',
    inactivePill: 'bg-[#DFF0FB] text-[#2563A8] hover:bg-[#C0E2F8]',
    activePill: 'bg-[#5B9BD5] text-white',
  },
  {
    key: 'Computer Science',
    label: 'Computer Science',
    shortLabel: 'Computer',
    iconName: 'laptop',
    color: '#9B59B6',
    textColor: '#ffffff',
    lightBg: '#F0E6FB',
    inactivePill: 'bg-[#F0E6FB] text-[#6B30A8] hover:bg-[#E0CCF7]',
    activePill: 'bg-[#9B59B6] text-white',
  },
  {
    key: 'EVS',
    label: 'Environmental Studies',
    shortLabel: 'EVS',
    iconName: 'leaf',
    color: '#6DBF67',
    textColor: '#ffffff',
    lightBg: '#E2F7E1',
    inactivePill: 'bg-[#E2F7E1] text-[#2D7A2A] hover:bg-[#C5ECC3]',
    activePill: 'bg-[#6DBF67] text-white',
  },
  {
    key: 'Sanskrit',
    label: 'Sanskrit',
    shortLabel: 'Sanskrit',
    iconName: 'scroll',
    color: '#E74C3C',
    textColor: '#ffffff',
    lightBg: '#FDEAE9',
    inactivePill: 'bg-[#FDEAE9] text-[#B02020] hover:bg-[#FBCFCE]',
    activePill: 'bg-[#E74C3C] text-white',
  },
  {
    key: 'Physical Education',
    label: 'Physical Education',
    shortLabel: 'Phy. Ed.',
    iconName: 'sports',
    color: '#27AE60',
    textColor: '#ffffff',
    lightBg: '#D5F5E3',
    inactivePill: 'bg-[#D5F5E3] text-[#1A7A42] hover:bg-[#ABEBC6]',
    activePill: 'bg-[#27AE60] text-white',
  },
  {
    key: 'Vocational Education',
    label: 'Vocational Education',
    shortLabel: 'Vocational',
    iconName: 'build',
    color: '#2980B9',
    textColor: '#ffffff',
    lightBg: '#D6EAF8',
    inactivePill: 'bg-[#D6EAF8] text-[#1A5F8A] hover:bg-[#AED6F1]',
    activePill: 'bg-[#2980B9] text-white',
  },
  {
    key: 'Kannada',
    label: 'Kannada',
    shortLabel: 'Kannada',
    iconName: 'languages',
    color: '#E53935',
    textColor: '#ffffff',
    lightBg: '#FFCDD2',
    inactivePill: 'bg-[#FFCDD2] text-[#B71C1C] hover:bg-[#EF9A9A]',
    activePill: 'bg-[#E53935] text-white',
  },
  {
    key: 'Information Technology',
    label: 'Information Technology',
    shortLabel: 'IT',
    iconName: 'laptop',
    color: '#1E88E5',
    textColor: '#ffffff',
    lightBg: '#BBDEFB',
    inactivePill: 'bg-[#BBDEFB] text-[#0D47A1] hover:bg-[#90CAF9]',
    activePill: 'bg-[#1E88E5] text-white',
  },
  {
    key: 'Artificial Intelligence',
    label: 'Artificial Intelligence',
    shortLabel: 'AI',
    iconName: 'sparkles',
    color: '#8E24AA',
    textColor: '#ffffff',
    lightBg: '#E1BEE7',
    inactivePill: 'bg-[#E1BEE7] text-[#4A148C] hover:bg-[#CE93D8]',
    activePill: 'bg-[#8E24AA] text-white',
  },
  {
    key: 'Art Education',
    label: 'Art Education',
    shortLabel: 'Art',
    iconName: 'highlighter',
    color: '#D81B60',
    textColor: '#ffffff',
    lightBg: '#F8BBD0',
    inactivePill: 'bg-[#F8BBD0] text-[#880E4F] hover:bg-[#F48FB1]',
    activePill: 'bg-[#D81B60] text-white',
  },
  {
    key: 'Value Education',
    label: 'Value Education',
    shortLabel: 'Values',
    iconName: 'sprout',
    color: '#00897B',
    textColor: '#ffffff',
    lightBg: '#B2DFDB',
    inactivePill: 'bg-[#B2DFDB] text-[#004D40] hover:bg-[#80CBC4]',
    activePill: 'bg-[#00897B] text-white',
  },
  {
    key: 'General Knowledge',
    label: 'General Knowledge',
    shortLabel: 'GK',
    iconName: 'lightbulb',
    color: '#FFB300',
    textColor: '#5B3B00',
    lightBg: '#FFECB3',
    inactivePill: 'bg-[#FFECB3] text-[#8B6A00] hover:bg-[#FFE082]',
    activePill: 'bg-[#FFB300] text-[#5B3B00]',
  },
];

/** Keyed by subject name for O(1) lookup */
export const SUBJECT_MAP: Record<string, SubjectConfig> = Object.fromEntries(
  SUBJECTS.map((s) => [s.key, s]),
);

export const SUBJECT_KEYS = SUBJECTS.map((s) => s.key);
