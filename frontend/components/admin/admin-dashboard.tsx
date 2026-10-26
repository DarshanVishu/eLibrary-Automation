'use client';

import { AdminActivityCharts } from './dashboard/activity-charts';
import { AdminPendingBanner } from './dashboard/pending-banner';
import { AdminRecentActivity } from './dashboard/recent-activity';
import { AdminStatsGrid } from './dashboard/stats-grid';

export function AdminDashboard({
  profile,
  stats,
  pendingApprovals,
  contentByType,
  recentActivity,
  monthlyActivity,
}: {
  profile: any;
  stats: any[];
  pendingApprovals: any[];
  contentByType: any[];
  recentActivity: any[];
  monthlyActivity: any[];
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Page title ── */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-0.5 text-sm font-medium">
          Good morning,{' '}
          <span className="text-foreground font-bold">{profile?.full_name || 'Admin'}</span>
        </p>
      </div>

      <AdminStatsGrid stats={stats} />
      <AdminPendingBanner count={pendingApprovals.length} />
      <AdminActivityCharts monthlyActivity={monthlyActivity} contentByType={contentByType} />
      <AdminRecentActivity recentActivity={recentActivity} />
    </div>
  );
}
