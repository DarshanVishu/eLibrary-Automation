import { Card, CardContent } from '@/components/ui/card';
import { Icon, IconName } from '@/components/ui/icon';

interface Stat {
  label: string;
  value: number | string;
  iconName: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border shadow-sm">
          <CardContent className="flex items-center gap-4 pt-5 pb-5">
            <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              {(() => {
                const map: Record<string, IconName> = {
                  Upload: 'upload',
                  Eye: 'visibility',
                  CheckCircle: 'check_circle',
                  Clock: 'schedule',
                };
                const iconName = map[stat.iconName] ?? 'visibility';
                return <Icon name={iconName} className="text-foreground h-6 w-6" />;
              })()}
            </div>
            <div className="min-w-0">
              <p className="text-foreground text-2xl font-bold">{stat.value}</p>
              <p className="text-muted-foreground truncate text-xs font-semibold">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
