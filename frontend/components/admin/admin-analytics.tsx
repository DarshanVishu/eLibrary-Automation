'use client';

import { TrendChart, TypePieChart, DailyBarsChart, SubjectBarsChart } from './analytics/charts';
import { AdminStatsGrid } from './dashboard/stats-grid';
import { ExportReportDialog } from './reports';
import { getAnalyticsData } from '@/app/admin/analytics/actions';
import { Button } from '@/components/ui/button';
import { type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useState, useTransition } from 'react';

type StatCard = { label: string; value: string; icon: IconName; trend: string };
type MonthlyPoint = { month: string; views: number; uploads: number };
type TypePoint = { name: string; value: number; color: string };
type SubjectPoint = { subject: string; count: number };
type DailyPoint = { day: string; views: number; sessions: number };

export function AdminAnalytics({
  stats: initialStats,
  monthlyActivity: initialMonthly,
  contentByType: initialByType,
  contentBySubject: initialBySubject,
  dailyTrend: initialDaily,
}: {
  stats: StatCard[];
  monthlyActivity: MonthlyPoint[];
  contentByType: TypePoint[];
  contentBySubject: SubjectPoint[];
  dailyTrend: DailyPoint[];
}) {
  const [period, setPeriod] = useState<'week' | 'month' | '6months'>('month');
  const [data, setData] = useState({
    stats: initialStats,
    monthlyActivity: initialMonthly,
    contentByType: initialByType,
    contentBySubject: initialBySubject,
    dailyTrend: initialDaily,
  });
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(p: 'week' | 'month' | '6months') {
    setPeriod(p);
    startTransition(async () => {
      try {
        const res = await getAnalyticsData(p);
        setData(res);
      } catch (err) {
        console.error('Failed to update analytics period:', err);
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-4 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground truncate text-2xl font-bold">Platform Analytics</h2>
          <p className="text-muted-foreground truncate text-sm">
            Usage over time across grades and subjects
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="border-border/60 bg-muted/40 inline-flex items-center gap-0.5 rounded-lg border p-0.5">
            {(['week', 'month', '6months'] as const).map((p) => (
              <Button
                key={p}
                onClick={() => handlePeriodChange(p)}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 rounded-md px-2.5 text-xs font-medium shadow-none transition-all',
                  period === p
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                )}
              >
                {p === '6months'
                  ? 'Last 6 Months'
                  : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
              </Button>
            ))}
          </div>
          <ExportReportDialog reportType="overall" />
        </div>
      </div>

      {/* ─── Stats & Charts Container with smooth transition ─── */}
      <div className={cn('space-y-6 transition-opacity duration-200', isPending && 'opacity-60')}>
        {/* ─── Stats ─── */}
        <AdminStatsGrid stats={data.stats} />

        {/* ─── Charts Row 1 ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TrendChart data={data.monthlyActivity} />
          <TypePieChart data={data.contentByType} />
        </div>

        {/* ─── Charts Row 2 ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DailyBarsChart data={data.dailyTrend} />
          <SubjectBarsChart data={data.contentBySubject} />
        </div>
      </div>
    </div>
  );
}
