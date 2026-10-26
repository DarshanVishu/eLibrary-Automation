import { Icon } from '@/components/ui/icon';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  date: string;
  targetGrades?: number[];
  icon?: string;
}

export interface ExamCountdown {
  id: string;
  examName: string;
  subject: string;
  date: string;
  grade: number;
}

interface AnnouncementsExamsPanelProps {
  announcements: Announcement[];
  exams: ExamCountdown[];
  userGrade: number;
  getDays: (date: string) => number;
}

export function AnnouncementsExamsPanel({
  announcements,
  exams,
  userGrade,
  getDays,
}: AnnouncementsExamsPanelProps) {
  const filtered = announcements
    .filter((a) => !a.targetGrades || a.targetGrades.includes(userGrade))
    .slice(0, 3);

  const upcoming = exams
    .filter((e) => e.grade === userGrade)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <section className="mt-6 grid grid-cols-1 gap-5 pb-8 transition-all duration-200 lg:grid-cols-5">
      {/* ── Announcements ── */}
      <div className="bg-card border-border text-card-foreground rounded-[20px] border-[1.5px] p-6 shadow-sm lg:col-span-3">
        <h2 className="text-foreground mb-4 flex items-center gap-2 text-base font-black">
          <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-xl">
            <Icon name="bell" size="sm" className="text-primary-foreground" filled />
          </span>
          Announcements
        </h2>
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No announcements right now.
            </p>
          ) : (
            filtered.map((a) => {
              const iconName =
                a.type === 'success'
                  ? ('check_circle' as const)
                  : a.type === 'warning'
                    ? ('warning' as const)
                    : ('info' as const);
              return (
                <div
                  key={a.id}
                  className="bg-muted/30 border-border rounded-2xl border px-4 py-3 transition-colors"
                >
                  <div className="flex gap-3">
                    <Icon name={iconName} size="sm" filled className="text-primary" />
                    <div>
                      <h4 className="text-foreground text-sm font-bold">{a.title}</h4>
                      <p className="text-muted-foreground text-xs">{a.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Upcoming Exams ── */}
      <div className="bg-card border-border text-card-foreground rounded-[20px] border-[1.5px] p-6 shadow-sm lg:col-span-2">
        <h2 className="text-foreground mb-4 flex items-center gap-2 text-base font-black">
          <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-xl">
            <Icon name="calendar" size="sm" className="text-primary-foreground" filled />
          </span>
          Upcoming Exams
        </h2>

        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((exam) => {
              const days = getDays(exam.date);
              const isUrgent = days <= 3;
              const isSoon = days <= 7 && !isUrgent;

              return (
                <div
                  key={exam.id}
                  className="bg-muted/30 border-border flex items-center gap-4 rounded-xl border p-3"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl font-black shadow-sm ${
                      isUrgent
                        ? 'bg-destructive text-destructive-foreground'
                        : isSoon
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-lg leading-none">{days}</span>
                    <span className="text-[9px] font-bold">days</span>
                  </div>
                  <div>
                    <h4 className="text-foreground text-sm font-bold">{exam.examName}</h4>
                    <p className="text-muted-foreground text-xs">{exam.subject}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="bg-primary/20 mb-3 flex h-14 w-14 items-center justify-center rounded-full">
              <Icon name="check_circle" size="xl" className="text-primary" filled />
            </span>
            <p className="text-muted-foreground text-sm font-semibold">
              No exams coming up — relax!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
