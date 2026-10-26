'use client';

import { RoleAccentProvider } from '@/components/providers/role-accent-provider';
import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';
import { IconName } from '@/components/ui/icon';
import { useAuth } from '@/lib/context/auth-context';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface NavItem {
  icon: IconName;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: 'home', label: 'Dashboard', path: '/teacher' },
  { icon: 'upload', label: 'Uploads', path: '/teacher/uploads' },
  { icon: 'people', label: 'Students', path: '/teacher/students' },
  { icon: 'analytics', label: 'Analytics', path: '/teacher/analytics' },
  { icon: 'settings', label: 'Settings', path: '/teacher/settings' },
];

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Show welcome toast only once per session (not on every page refresh)
  useEffect(() => {
    if (!user) return;
    const key = `welcomed_${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    toast.success(`Welcome back, ${user.name}!`);
  }, [user]);

  const initial = user?.name?.[0]?.toUpperCase() ?? 'T';
  const headerUser = user
    ? { initial, name: user.name, title: 'Teacher' }
    : { initial, name: 'Teacher', title: 'Teacher Portal' };

  return (
    <RoleAccentProvider role="teacher">
      <div className="bg-background flex h-screen overflow-hidden">
        <Sidebar
          open={open}
          setOpen={setOpen}
          navItems={navItems}
          pathname={pathname || ''}
          rootPath="/teacher"
          logoIcon="book"
          roleLabel="Teacher"
          menuLabel="Menu"
          user={headerUser}
          showNotifications
          userId={user?.id}
          changePasswordPath="/teacher/settings"
        />

        {/* ── Main ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header onMenuOpen={() => setOpen(true)} />

          <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </RoleAccentProvider>
  );
}
