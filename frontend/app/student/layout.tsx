'use client';
import { StudentLayout } from '@/components/layouts/student-layout';
import { RoleAccentProvider } from '@/components/providers/role-accent-provider';

export const dynamic = 'force-dynamic';


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <RoleAccentProvider role="student">
        <StudentLayout>{children}</StudentLayout>
      </RoleAccentProvider>
    </div>
  );
}
