'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { DEFAULT_PLATFORM_NAME } from '@/lib/constants';

export interface HeaderUser {
  name: string;
  title?: string;
  initial: string;
}

interface HeaderProps {
  onMenuOpen: () => void;
  avatarInitial?: string;
  user?: HeaderUser;
  showNotifications?: boolean;
  changePasswordPath?: string;
  /** The authenticated user's Supabase UUID, used to power realtime notifications */
  userId?: string;
  /** Path to the full notifications page for this role */
  allNotificationsPath?: string;
}

export function Header({ onMenuOpen }: HeaderProps) {
  return (
    <header className="bg-sidebar border-border flex h-[52px] shrink-0 items-center justify-between border-b px-4 lg:hidden">
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-9 w-9"
          onClick={onMenuOpen}
        >
          <Icon name="menu" size="lg" />
        </Button>
        <span className="text-foreground text-sm font-bold tracking-tight">
          {DEFAULT_PLATFORM_NAME}
        </span>
      </div>
    </header>
  );
}
