import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  positive?: boolean;
}

export function AdminStatsGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-border shadow-sm">
          <CardContent className="flex items-center gap-4 pt-5 pb-5">
            <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <Icon name={s.icon as any} size="lg" filled className="text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-foreground text-2xl font-bold">{s.value}</p>
              <p className="text-muted-foreground truncate text-xs font-semibold">{s.label}</p>
              {s.trend && (
                <p
                  className={`mt-0.5 text-xs font-bold ${s.positive ? 'text-success' : 'text-warning'}`}
                >
                  {s.trend}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
