'use client';

import { getUsersStats, getUsersPageData } from './actions';
import type { UsersStats, UsersPageData } from './actions';
import { AdminUsers } from '@/components/admin';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import type { AppRole } from '@/lib/types/database';
import { useState, useEffect } from 'react';

export default function Page() {
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [pageData, setPageData] = useState<UsersPageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters / pagination state lifted here so refresh can reset them
  const [page, setPage] = useState(0);
  const [filterRole, setFilterRole] = useState<AppRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchStats = async () => {
    const s = await getUsersStats();
    setStats(s);
  };

  const fetchPage = async (
    p: number,
    role: AppRole | 'all',
    status: 'active' | 'inactive' | 'all',
    q: string,
    g: string,
  ) => {
    const data = await getUsersPageData(p, role, status, q, g);
    setPageData(data);
  };

  // Initial load
  useEffect(() => {
    async function init() {
      await Promise.all([fetchStats(), fetchPage(0, 'all', 'all', '', 'all')]);
      setLoading(false);
    }
    init();
  }, []);

  // Re-fetch page whenever filters / page change (after initial load)
  useEffect(() => {
    if (!loading) {
      fetchPage(page, filterRole, filterStatus, search, filterGrade);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterRole, filterStatus, search, filterGrade]);

  const handleRefresh = async () => {
    setLoading(true);
    setPage(0);
    await Promise.all([fetchStats(), fetchPage(0, filterRole, filterStatus, search, filterGrade)]);
    setLoading(false);
  };

  if (loading || !stats || !pageData) return <FullScreenLoading />;

  return (
    <AdminUsers
      stats={stats}
      pageData={pageData}
      page={page}
      filterRole={filterRole}
      filterStatus={filterStatus}
      filterGrade={filterGrade}
      search={search}
      onPageChange={setPage}
      onFilterRoleChange={(r) => {
        setFilterRole(r);
        if (r !== 'student') setFilterGrade('all');
        setPage(0);
      }}
      onFilterStatusChange={(s) => {
        setFilterStatus(s);
        setPage(0);
      }}
      onFilterGradeChange={(g) => {
        setFilterGrade(g);
        setPage(0);
      }}
      onSearchChange={(q) => {
        setSearch(q);
        setPage(0);
      }}
      onRefresh={handleRefresh}
    />
  );
}
