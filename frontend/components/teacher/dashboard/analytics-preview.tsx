'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const chartVars = {
  grid: 'var(--border)',
  axisText: 'var(--muted-foreground)',
  tooltipBg: 'var(--popover)',
  tooltipBorder: '1px solid var(--border)',
  tooltipCursor: 'var(--muted)',
};

const tooltipStyle = {
  background: chartVars.tooltipBg,
  border: chartVars.tooltipBorder,
  borderRadius: 8,
  fontSize: 11,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  color: 'var(--popover-foreground)',
} as const;

interface ViewsPerMaterial {
  name: string;
  views: number;
}

interface SubjectPerformance {
  subject: string;
  views: number;
  percentage: number;
}

interface AnalyticsPreviewProps {
  viewsPerMaterial: ViewsPerMaterial[];
  subjectPerformance: SubjectPerformance[];
}

export function AnalyticsPreview({ viewsPerMaterial, subjectPerformance }: AnalyticsPreviewProps) {
  const router = useRouter();

  return (
    <Card
      className="border-border cursor-pointer shadow-sm"
      onClick={() => router.push('/teacher/analytics')}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-sm font-bold">Analytics</CardTitle>
          <span className="text-muted-foreground text-xs">View All →</span>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="mb-4">
          <p className="text-muted-foreground mb-2 text-xs">Views per Material</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={viewsPerMaterial.slice(0, 4)} barSize={12}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: chartVars.axisText }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: chartVars.tooltipCursor }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--popover-foreground)' }}
                itemStyle={{ color: 'var(--popover-foreground)' }}
              />
              <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                {viewsPerMaterial.slice(0, 4).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-muted-foreground mb-2 text-xs">Top Subject</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{subjectPerformance[0]?.subject || '-'}</p>
              <p className="text-muted-foreground text-xs">
                {subjectPerformance[0]?.views?.toLocaleString() || 0} views
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{subjectPerformance[0]?.percentage || 0}%</p>
              <p className="text-muted-foreground text-xs">share</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
