'use client';

import { TeacherLayout } from '@/components/layouts/teacher-layout';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';



export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure teacher theme is applied to body for proper dark mode support
    document.body.classList.add('teacher-theme');
    return () => {
      document.body.classList.remove('teacher-theme');
    };
  }, []);

  return <TeacherLayout>{children}</TeacherLayout>;
}
