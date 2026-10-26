'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
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
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--popover-foreground)',
};

interface MonthlyPoint {
  month: string;
  views: number;
  uploads: number;
}
interface TypePoint {
  name: string;
  value: number;
  color: string;
}

export function AdminActivityCharts({
  monthlyActivity,
  contentByType,
}: {
  monthlyActivity: MonthlyPoint[];
  contentByType: TypePoint[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Monthly bar chart */}
      <Card className="border-border shadow-sm lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-foreground text-sm font-bold">Monthly Activity</CardTitle>
          <CardDescription className="text-xs font-medium">
            Views and uploads over 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyActivity} barSize={16} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartVars.grid} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: chartVars.axisText, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartVars.axisText, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: chartVars.tooltipCursor }}
                labelStyle={{ color: 'var(--popover-foreground)' }}
                itemStyle={{ color: 'var(--popover-foreground)' }}
              />
              <Bar dataKey="views" name="Views" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uploads" name="Uploads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Content by type pie */}
      <Card className="border-border shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-foreground text-sm font-bold">Content by Type</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {contentByType.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={contentByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {contentByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ ...tooltipStyle, fontWeight: 400 }}
                    labelStyle={{ color: 'var(--popover-foreground)' }}
                    itemStyle={{ color: 'var(--popover-foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {contentByType.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span className="text-muted-foreground text-xs font-semibold">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-foreground text-xs font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <span className="text-muted-foreground text-sm">No content yet</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
