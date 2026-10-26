'use client';

import { RoleAccentProvider } from '@/components/providers/role-accent-provider';
import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';
import { IconName } from '@/components/ui/icon';
import { useAuth } from '@/lib/context/auth-context';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  icon: IconName;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: 'home', label: 'Dashboard', path: '/admin' },
  { icon: 'library', label: 'Content Library', path: '/admin/library' },
  { icon: 'approval', label: 'Approvals', path: '/admin/approvals' },
  { icon: 'people', label: 'Users', path: '/admin/users' },
  { icon: 'analytics', label: 'Analytics', path: '/admin/analytics' },
  { icon: 'settings', label: 'Settings', path: '/admin/settings' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const initial = user?.name?.[0]?.toUpperCase() ?? 'A';
  const headerUser = user
    ? { initial, name: user.name, title: 'Administrator' }
    : { initial, name: 'Admin', title: 'Administrator' };

  return (
    <RoleAccentProvider role="admin">
      <div className="bg-background flex h-screen overflow-hidden">
        <Sidebar
          open={open}
          setOpen={setOpen}
          navItems={navItems}
          pathname={pathname || ''}
          rootPath="/admin"
          logoIcon="library"
          roleLabel="Admin"
          menuLabel="Menu"
          user={headerUser}
          showNotifications
          userId={user?.id}
          changePasswordPath="/admin/change-password"
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
