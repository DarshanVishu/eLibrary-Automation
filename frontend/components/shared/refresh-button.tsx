'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  label?: string;
}

export function RefreshButton({ onRefresh, label }: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleClick = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick} disabled={refreshing}>
      <Icon name="refresh" size="sm" className={refreshing ? 'animate-spin' : ''} />
    </Button>
  );
}
