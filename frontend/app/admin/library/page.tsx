'use client';

import { getLibraryStats, getLibraryPageData } from './actions';
import type { LibraryStats, LibraryPageData } from './actions';
import { AdminLibrary } from '@/components/admin';
import { useAutoRefreshOnUpload } from '@/components/providers/upload-provider';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { useState, useEffect } from 'react';

export default function Page() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [pageData, setPageData] = useState<LibraryPageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters / pagination state lifted here so refresh can reset them
  const [page, setPage] = useState(0);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchStats = async () => {
    const s = await getLibraryStats();
    setStats(s);
  };

  const fetchPage = async (p: number, q: string, subject: string, type: string, grade: string) => {
    const data = await getLibraryPageData(p, q, subject, type, grade);
    setPageData(data);
  };

  // Initial load
  useEffect(() => {
    async function init() {
      await Promise.all([fetchStats(), fetchPage(0, '', 'all', 'all', 'all')]);
      setLoading(false);
    }
    init();
  }, []);

  // Re-fetch page whenever filters / page change (after initial load)
  useEffect(() => {
    if (!loading) {
      fetchPage(page, search, filterSubject, filterType, filterGrade);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterSubject, filterType, filterGrade]);

  const handleRefresh = async () => {
    // Refresh data in the background without showing the full-screen spinner.
    setPage(0);
    await Promise.all([fetchStats(), fetchPage(0, search, filterSubject, filterType, filterGrade)]);
  };

  // Auto-refresh when any upload completes from the floating upload widget.
  useAutoRefreshOnUpload(handleRefresh);

  if (loading || !stats || !pageData) return <FullScreenLoading />;

  return (
    <AdminLibrary
      stats={stats}
      pageData={pageData}
      page={page}
      filterSubject={filterSubject}
      filterType={filterType}
      filterGrade={filterGrade}
      search={search}
      onPageChange={setPage}
      onFilterSubjectChange={(s) => {
        setFilterSubject(s);
        setPage(0);
      }}
      onFilterTypeChange={(t) => {
        setFilterType(t);
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
      onClearAll={() => {
        setSearch('');
        setFilterSubject('all');
        setFilterType('all');
        setFilterGrade('all');
        setPage(0);
      }}
      onRefresh={handleRefresh}
    />
  );
}
