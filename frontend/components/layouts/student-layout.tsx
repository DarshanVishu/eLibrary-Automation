'use client';
import { signOut } from '@/app/actions';
import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';
import { Button } from '@/components/ui/button';
import { IconName, Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/context/auth-context';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems: { icon: IconName; label: string; path: string }[] = [
  { icon: 'home', label: 'Home', path: '/student' },
  { icon: 'library', label: 'Library', path: '/student/library' },
  { icon: 'schedule', label: 'Recent', path: '/student/recent' },
  { icon: 'bookmark', label: 'Bookmarks', path: '/student/bookmarks' },
];

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const initial = user?.name?.[0]?.toUpperCase() ?? 'S';
  const headerUser = user
    ? { initial, name: user.name, title: `Grade ${user.grade ?? '—'}` }
    : { initial, name: 'Student', title: 'Student Portal' };

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <Sidebar
        open={open}
        setOpen={setOpen}
        navItems={navItems}
        pathname={pathname || ''}
        rootPath="/student"
        logoIcon="school"
        roleLabel="Student"
        user={headerUser}
        showNotifications
        userId={user?.id}
        changePasswordPath="/student/change-password"
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuOpen={() => setOpen(true)} />

        <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
