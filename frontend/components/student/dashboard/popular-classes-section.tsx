'use client';
import { MaterialCard } from '../student-material-card';
import type { StudentMaterial } from '@/app/student/actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PopularClassesProps {
  materials: StudentMaterial[];
  userGrade: number;
}

export function PopularClassesSection({ materials, userGrade }: PopularClassesProps) {
  const router = useRouter();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="sparkles" size="sm" className="text-muted-foreground" />
          <h2 className="text-foreground text-base font-semibold">Recently added</h2>
          <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[11px]">
            Grade {userGrade}
          </span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/student/library">
            View all
            <Icon name="chevron_right" size="sm" />
          </Link>
        </Button>
      </div>

      {materials.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <MaterialCard
              key={m.id}
              {...m}
              onClick={() => router.push(`/student/viewer/${m.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted/40 border-border text-muted-foreground rounded-xl border py-10 text-center text-sm">
          No materials for Grade {userGrade} yet — check back soon.
        </div>
      )}
    </section>
  );
}
