// ── Strict flat subject colors (standard utilitarian tones) ──
export const subjectColors: Record<string, { primary: string; light: string; onLight: string }> = {
  Mathematics: { primary: '#2563EB', light: '#EFF6FF', onLight: '#1E3A8A' }, // Flat Blue
  Science: { primary: '#16A34A', light: '#F0FDF4', onLight: '#14532D' }, // Flat Green
  English: { primary: '#D97706', light: '#FFFBEB', onLight: '#78350F' }, // Flat Amber
  Hindi: { primary: '#DC2626', light: '#FEF2F2', onLight: '#7F1D1D' }, // Flat Red
  'Social Science': { primary: '#4F46E5', light: '#EEF2FF', onLight: '#312E81' }, // Flat Indigo
  'Computer Science': { primary: '#0891B2', light: '#ECFEFF', onLight: '#164E63' }, // Flat Cyan
  Sanskrit: { primary: '#EA580C', light: '#FFF7ED', onLight: '#7C2D12' }, // Flat Orange
  EVS: { primary: '#059669', light: '#ECFDF5', onLight: '#064E3B' }, // Flat Emerald
};

// ── Strict flat material type colors ──
export const typeColors: Record<string, { primary: string; light: string }> = {
  'NCERT Textbook': { primary: '#2563EB', light: '#EFF6FF' },
  'Question Bank': { primary: '#16A34A', light: '#F0FDF4' },
  'Model Paper': { primary: '#D97706', light: '#FFFBEB' },
  'Study Notes': { primary: '#4F46E5', light: '#EEF2FF' },
};

// ── Role badge colors (matching specific flat role themes) ──
export const roleBadgeColors: Record<string, { primary: string; light: string }> = {
  admin: { primary: '#0F172A', light: '#F1F5F9' }, // Slate
  teacher: { primary: '#16A34A', light: '#F0FDF4' }, // Green
  student: { primary: '#2563EB', light: '#EFF6FF' }, // Blue
};
