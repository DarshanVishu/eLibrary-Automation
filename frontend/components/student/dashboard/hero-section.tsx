'use client';
import type { ExamCountdown } from './announcements-exams-panel';
import type { StudentMaterial } from '@/app/student/actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { GRADE_MOTTOS } from '@/lib/constants/dashboard';
import type { User } from '@/lib/context/auth-context';
import Link from 'next/link';

interface HeroSectionProps {
  user: User;
  bookmarkedCount: number;
  recentlyAddedCount: number;
  continueReading: StudentMaterial | undefined;
  upcomingExam: ExamCountdown | undefined;
  getDays: (date: string) => number;
}

export function HeroSection({
  user,
  bookmarkedCount,
  recentlyAddedCount,
  continueReading,
  upcomingExam,
  getDays,
}: HeroSectionProps) {
  const userGrade = user.grade || 5;

  return (
    <section className="bg-card border-border text-card-foreground relative z-20 rounded-2xl border shadow-sm">
      <div className="grid min-h-[420px] grid-cols-1 items-stretch md:grid-cols-2">
        {/* ── Left: text ── */}
        <div className="flex flex-col justify-center px-8 py-10 md:py-12">
          {/* Grade pill */}
          <span className="border-border bg-muted text-muted-foreground mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <Icon name="school" size="xs" />
            Grade {userGrade}
          </span>

          <h1 className="text-foreground mb-2 text-3xl leading-tight font-semibold md:text-4xl">
            Ready to <span className="text-primary">learn today?</span>
          </h1>

          <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
            {GRADE_MOTTOS[userGrade] ?? `Welcome back, ${user.name}!`}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            {continueReading ? (
              <Button asChild>
                <Link
                  href={`/student/viewer/${continueReading.id}${
                    continueReading.lastPage && continueReading.lastPage > 1
                      ? `?page=${continueReading.lastPage}`
                      : ''
                  }`}
                >
                  <Icon name="book" size="sm" filled />
                  Continue reading
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/student/library">
                  <Icon name="library" size="sm" filled />
                  Browse library
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/student/bookmarks">
                <Icon name="bookmark" size="sm" />
                My bookmarks
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-7 flex flex-wrap gap-5">
            {[
              { val: bookmarkedCount, label: 'Saved', icon: 'bookmark' as const },
              { val: recentlyAddedCount, label: 'New this week', icon: 'sparkles' as const },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Icon name={s.icon} size="sm" className="text-primary" />
                </span>
                <div>
                  <p className="text-foreground text-sm leading-none font-semibold">{s.val}</p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: illustration ── */}
        <div className="relative flex items-stretch overflow-hidden rounded-r-2xl">
          <video
            src="/images/student.webm"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            aria-hidden="true"
          />

          {/* Upcoming exam chip — bottom left, only when data exists */}
          {upcomingExam && (
            <div className="border-border bg-card/90 absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm backdrop-blur-sm">
              <span className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                <Icon name="calendar" size="xs" className="text-primary-foreground" filled />
              </span>
              <div>
                <p className="text-foreground text-xs font-medium">{upcomingExam.examName}</p>
                <p className="text-muted-foreground text-[9px]">
                  {upcomingExam.subject} · {getDays(upcomingExam.date)}d away
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
