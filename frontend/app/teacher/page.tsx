'use client';

import { getTeacherDashboardData } from './actions';
import { useUploads } from '@/components/providers/upload-provider';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { AnalyticsPreview } from '@/components/teacher/dashboard/analytics-preview';
import { MonthlyChart } from '@/components/teacher/dashboard/monthly-chart';
import { RecentActivity } from '@/components/teacher/dashboard/recent-activity';
import { StatsGrid } from '@/components/teacher/dashboard/stats-grid';
import { UploadModal } from '@/components/teacher/dashboard/upload-modal';
import { UploadsList } from '@/components/teacher/dashboard/uploads-list';
import { useEffect, useState } from 'react';

export default function Page() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getTeacherDashboardData>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { addUpload } = useUploads();

  useEffect(() => {
    getTeacherDashboardData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <FullScreenLoading />;
  if (!data) return null;

  const {
    myUploads,
    recentActivity,
    stats,
    pendingCount,
    monthlyActivity,
    viewsPerMaterial,
    subjectPerformance,
  } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-0.5 text-sm font-medium">
          Good morning,{' '}
          <span className="text-foreground font-bold">{data.profile?.full_name || 'Teacher'}</span>
        </p>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <UploadsList myUploads={myUploads} />

        <div className="space-y-4 lg:col-span-2">
          <RecentActivity recentActivity={recentActivity} pendingCount={pendingCount} />
          <AnalyticsPreview
            viewsPerMaterial={viewsPerMaterial}
            subjectPerformance={subjectPerformance}
          />
        </div>
      </div>

      {/* Monthly Chart */}
      <MonthlyChart monthlyActivity={monthlyActivity} />

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          subjects={data.subjects || []}
          onClose={() => setShowUploadModal(false)}
          onSubmit={({ file, title, subjectId, grade, type }) => {
            addUpload({ file, title, subjectId, grade, type });
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}
