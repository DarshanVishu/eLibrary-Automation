import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const chartVars = {
  grid: 'var(--border)',
  axisText: 'var(--muted-foreground)',
  tooltipBg: 'var(--popover)',
  tooltipBorder: '1px solid var(--border)',
};

interface MonthlyActivity {
  month: string;
  views: number;
}

interface MonthlyChartProps {
  monthlyActivity: MonthlyActivity[];
}

export function MonthlyChart({ monthlyActivity }: MonthlyChartProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-sm font-bold">Monthly View Trends</CardTitle>
        <CardDescription className="text-xs">
          How students engaged with your materials
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
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
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                background: chartVars.tooltipBg,
                border: chartVars.tooltipBorder,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorViews)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
