import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

interface ActivityItem {
  type: string;
  action: string;
  time: string;
}

interface RecentActivityProps {
  recentActivity: ActivityItem[];
  pendingCount: number;
}

export function RecentActivity({ recentActivity, pendingCount }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      {/* Recent Activity */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground text-sm font-bold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-3">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex gap-3">
                <div className="bg-muted mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {act.type === 'approved' ? (
                    <Icon name="check_circle" className="text-success h-3.5 w-3.5" />
                  ) : (
                    <Icon name="schedule" className="text-warning h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs">{act.action}</p>
                  <p className="text-muted-foreground text-xs">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Alert */}
      <Card className="border-border shadow-sm">
        <CardContent className="flex items-center gap-3 py-6">
          <Icon
            name={pendingCount > 0 ? 'warning' : 'check_circle'}
            className={`${pendingCount > 0 ? 'text-warning' : 'text-success'} h-5 w-5 shrink-0`}
          />
          <div>
            <p className="text-sm font-medium">
              {pendingCount || 0} materials pending admin approval
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {pendingCount > 0
                ? 'Your uploads will be visible to students once approved.'
                : 'All your uploads have been approved and are visible to students.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
