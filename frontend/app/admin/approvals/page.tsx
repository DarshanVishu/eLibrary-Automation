'use client';

import { getApprovalsData } from './actions';
import { AdminApprovals } from '@/components/admin';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useCallback } from 'react';

export default function Page() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getApprovalsData>> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const result = await getApprovalsData();
    setData(result);
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchData();
      setLoading(false);
    };
    init();
  }, [fetchData]);

  // Realtime subscription for resource changes (new uploads, status updates)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-approvals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources',
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (loading) return <FullScreenLoading />;
  if (!data) return null;

  return <AdminApprovals {...data} onRefresh={fetchData} />;
}
