'use client';

import { signOut } from '@/app/actions';
import { NotificationCenter } from '@/components/shared/notification-center';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon, IconName } from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getPublicPlatformSettings } from '@/lib/actions/settings';
import { DEFAULT_PLATFORM_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export interface SidebarNavItem {
  icon: IconName;
  label: string;
  path: string;
  badge?: number;
}

export interface SidebarUser {
  name: string;
  title?: string;
  initial: string;
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  navItems: SidebarNavItem[];
  pathname: string;
  rootPath: string;
  logoIcon: IconName;
  roleLabel: string;
  menuLabel?: string;
  user?: SidebarUser;
  avatarInitial?: string;
  showNotifications?: boolean;
  userId?: string;
  allNotificationsPath?: string;
  changePasswordPath?: string;
}

export function Sidebar({
  open,
  setOpen,
  navItems,
  pathname,
  rootPath,
  logoIcon,
  roleLabel,
  menuLabel,
  user,
  avatarInitial,
  showNotifications = false,
  userId,
  allNotificationsPath,
  changePasswordPath = '/teacher/settings',
}: SidebarProps) {
  const router = useRouter();
  const [platformName, setPlatformName] = useState(DEFAULT_PLATFORM_NAME);
  const initial = user?.initial || avatarInitial || 'U';

  useEffect(() => {
    let mounted = true;
    async function loadPlatformName() {
      const data = await getPublicPlatformSettings();
      if (mounted && data?.platformName) {
        setPlatformName(data.platformName);
      }
    }
    loadPlatformName();
    return () => {
      mounted = false;
    };
  }, []);

  const isActive = (path: string) => {
    // Strip trailing slashes for comparison
    const clean = pathname.replace(/\/$/, '');
    const itemPath = path.replace(/\/$/, '');
    if (itemPath === rootPath.replace(/\/$/, '')) {
      // Dashboard/Home: active only on exact match
      return clean === itemPath;
    }
    return clean === itemPath || clean.startsWith(itemPath + '/');
  };

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div
          className="bg-foreground/30 fixed inset-0 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`bg-sidebar text-sidebar-foreground border-sidebar-border fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm">
            <Icon name={logoIcon} size="md" filled />
          </div>
          <div>
            <p className="text-sidebar-foreground text-base font-bold tracking-tight">
              {platformName}
            </p>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              {roleLabel}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-auto lg:hidden"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" size="md" />
          </Button>
        </div>

        {menuLabel && (
          <div className="px-4 pb-1">
            <p className="text-muted-foreground px-2 text-[10px] font-bold tracking-widest uppercase">
              {menuLabel}
            </p>
          </div>
        )}

        <ScrollArea className="flex-1">
          <nav className="space-y-0.5 px-3 py-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  variant="ghost"
                  className={`group h-auto w-full justify-start gap-3 rounded-xl px-4 py-2.5 text-left transition-all ${
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold'
                      : 'text-muted-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-primary font-medium'
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size="md"
                    filled={active}
                    className={
                      active
                        ? 'text-sidebar-accent-foreground'
                        : 'text-muted-foreground group-hover:text-sidebar-primary'
                    }
                  />
                  <span
                    className={`flex-1 truncate text-sm ${
                      active
                        ? 'text-sidebar-accent-foreground font-bold'
                        : 'group-hover:text-sidebar-primary font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.badge && !active && (
                    <Badge className="bg-sidebar-primary text-sidebar-primary-foreground h-[18px] min-w-[18px] rounded-md px-1 text-[10px] font-bold">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* ── Sidebar Footer (Theme Toggle, Notifications, Profile) ── */}
        <div className="mt-auto p-3">
          <div className="bg-sidebar-accent/30 flex items-center justify-between gap-2 rounded-xl p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hover:bg-sidebar-accent/50 flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors focus:outline-none"
                >
                  <Avatar className="bg-primary text-primary-foreground size-8 shrink-0 rounded-md">
                    <AvatarFallback className="bg-primary text-primary-foreground rounded-md text-xs font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sidebar-foreground truncate text-xs leading-tight font-bold">
                      {user?.name || 'Account'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="start"
                sideOffset={8}
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm leading-none font-medium">{user?.name || 'Account'}</p>
                    {user?.title && (
                      <p className="text-muted-foreground text-xs leading-none">{user.title}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {changePasswordPath && (
                  <DropdownMenuItem asChild className="cursor-pointer gap-2 px-2.5 py-3">
                    <Link
                      className="text-muted-foreground hover:text-foreground"
                      href={changePasswordPath}
                    >
                      <Icon name="lock_reset" size="sm" />
                      Change Password
                    </Link>
                  </DropdownMenuItem>
                )}
                <form action={signOut} className="w-full">
                  <DropdownMenuItem
                    className="text-muted-foreground hover:text-foreground w-full cursor-pointer gap-2 px-2.5 py-3"
                    onClick={(event) => {
                      event.currentTarget.closest('form')?.requestSubmit();
                    }}
                  >
                    <Icon name="logout" size="sm" />
                    Sign Out
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex shrink-0 items-center gap-1">
              {showNotifications && (
                <NotificationCenter
                  userId={userId}
                  allNotificationsPath={allNotificationsPath}
                  side="top"
                  align="start"
                />
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
