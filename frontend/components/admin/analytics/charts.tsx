'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

export const chartVars = {
  grid: 'var(--border)',
  axisText: 'var(--muted-foreground)',
  tooltipBg: 'var(--popover)',
  tooltipBorder: '1px solid var(--border)',
  tooltipCursor: 'var(--muted)',
};

export const tooltipStyle = {
  background: chartVars.tooltipBg,
  border: chartVars.tooltipBorder,
  borderRadius: '8px',
  fontSize: '13px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  color: 'var(--popover-foreground)',
};

// ── Trend Chart (Area) ─────────────────────────────────────────────────
interface MonthlyPoint {
  month: string;
  views: number;
  uploads: number;
}

export function TrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <Card className="border-border shadow-sm lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-foreground text-lg font-bold">Monthly View Trends</CardTitle>
        <CardDescription>Student views vs teacher uploads</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              tick={{ fontSize: 12, fill: chartVars.axisText }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--popover-foreground)' }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#viewsGrad)"
              name="Views"
            />
            <Line
              type="monotone"
              dataKey="uploads"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              name="Uploads"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Type Pie Chart ─────────────────────────────────────────────────────
interface TypePoint {
  name: string;
  value: number;
  color: string;
}

export function TypePieChart({ data }: { data: TypePoint[] }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground text-lg font-bold">Content by Type</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--popover-foreground)' }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-6 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                <span className="text-muted-foreground text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-foreground text-sm font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Daily Bar Chart ────────────────────────────────────────────────────
interface DailyPoint {
  day: string;
  views: number;
  sessions: number;
}

export function DailyBarsChart({ data }: { data: DailyPoint[] }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground text-lg font-bold">This Week – Daily Views</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartVars.grid} vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: chartVars.axisText }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 12, fill: chartVars.axisText }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: chartVars.tooltipCursor }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--popover-foreground)' }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
            />
            <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} name="Views" />
            <Bar dataKey="sessions" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Subject Bar Chart ─────────────────────────────────────────────────
interface SubjectPoint {
  subject: string;
  count: number;
}

export function SubjectBarsChart({ data }: { data: SubjectPoint[] }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground text-lg font-bold">Content by Subject</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartVars.grid} vertical={false} />
            <XAxis
              dataKey="subject"
              tick={{ fontSize: 12, fill: chartVars.axisText }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 12, fill: chartVars.axisText }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: chartVars.tooltipCursor }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--popover-foreground)' }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Resources" isAnimationActive>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
