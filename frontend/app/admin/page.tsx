'use client';

import { getAdminDashboardData } from './actions';
import { AdminDashboard } from '@/components/admin';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { useState, useEffect } from 'react';

export default function Page() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminDashboardData>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboardData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!data) return null;

  return <AdminDashboard {...data} />;
}
