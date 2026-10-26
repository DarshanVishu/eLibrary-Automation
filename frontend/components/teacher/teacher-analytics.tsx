'use client';

import { getTeacherAnalyticsData } from '@/app/teacher/analytics/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon, IconName } from '@/components/ui/icon';
import { CHART_COLORS } from '@/lib/constants';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
  fontSize: 13,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  color: 'var(--popover-foreground)',
} as const;

const iconMap: Record<string, IconName> = {
  eye: 'visibility',
  upload: 'upload',
  check_circle: 'check_circle',
  pending: 'schedule',
};

export function TeacherAnalytics() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getTeacherAnalyticsData>> | null>(
    null,
  );

  useEffect(() => {
    getTeacherAnalyticsData().then(setData);
  }, []);

  if (!data) return null;

  const { stats, monthlyActivity, contentByType, dailyTrend, topResources } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h2 className="text-foreground text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground text-sm">
          Track how students engage with your materials
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const iconName = iconMap[stat.icon] || 'visibility';
          return (
            <Card key={stat.label} className="border-border shadow-sm">
              <CardContent className="flex items-center gap-4 pt-5 pb-5">
                <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <Icon name={iconName} className="text-foreground h-6 w-6" />
                </div>
                <div>
                  <div className="text-foreground text-2xl font-bold">{stat.value}</div>
                  <div className="text-muted-foreground text-xs font-semibold">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground text-sm font-bold">Monthly View Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={192}>
              <AreaChart
                data={monthlyActivity}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartVars.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: chartVars.axisText }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartVars.axisText }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: chartVars.tooltipCursor }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'var(--popover-foreground)' }}
                  itemStyle={{ color: 'var(--popover-foreground)' }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#viewsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-sm font-bold">Views by Type</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={contentByType}
                  cx="50%"
                  cy="45%"
                  innerRadius={32}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {contentByType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: chartVars.tooltipCursor }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'var(--popover-foreground)' }}
                  itemStyle={{ color: 'var(--popover-foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {contentByType.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-xs">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-sm font-bold">
              This Week&apos;s Daily Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={dailyTrend} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartVars.grid} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: chartVars.axisText }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: chartVars.axisText }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: chartVars.tooltipCursor }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'var(--popover-foreground)' }}
                  itemStyle={{ color: 'var(--popover-foreground)' }}
                />
                <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                  {dailyTrend.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-sm font-bold">Views by Grade</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={176}>
              <BarChart
                data={data.contentBySubject.map((s) => ({
                  grade: s.subject,
                  views: s.count * 10,
                }))}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartVars.grid} />
                <XAxis
                  dataKey="grade"
                  tick={{ fontSize: 10, fill: chartVars.axisText }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: chartVars.axisText }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: chartVars.tooltipBg,
                    border: chartVars.tooltipBorder,
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                  {data.contentBySubject.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon name="star" className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-foreground text-sm font-bold">
              Top Performing Materials
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-3">
            {topResources.map((material, i) => (
              <div key={material.id} className="flex items-center gap-4">
                <div className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium" title={material.title}>
                    {material.title}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {material.views.toLocaleString()} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
