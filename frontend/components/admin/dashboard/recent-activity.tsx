import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

interface ActivityItem {
  id: string;
  user: string;
  avatar: string;
  action: string;
  book: string;
  grade: string;
  time: string;
}

export function AdminRecentActivity({ recentActivity }: { recentActivity: ActivityItem[] }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <Icon name="schedule" size="md" filled className="text-foreground" />
          <CardTitle className="text-foreground text-sm font-bold">Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="divide-border/60 space-y-0 divide-y">
          {recentActivity.length > 0 ? (
            recentActivity.map((act) => (
              <div key={act.id} className="flex items-center gap-3 py-3">
                <div
                  className={`text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    act.action === 'uploaded' ? 'bg-success' : 'bg-primary/90'
                  }`}
                >
                  {act.avatar}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <span className="text-foreground font-bold">{act.user}</span>
                  <span className="text-muted-foreground font-medium"> {act.action} </span>
                  <span className="text-foreground font-semibold">{act.book}</span>
                  <span className="text-muted-foreground font-medium">
                    {' '}
                    {act.grade !== '-' ? `· Gr. ${act.grade}` : ''}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="border-border bg-muted text-muted-foreground shrink-0 text-[10px] font-bold"
                >
                  {act.time}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground py-4 text-center text-sm">
              No recent activity found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
