'use client';
import { Icon } from '@/components/ui/icon';
import { SUBJECTS } from '@/lib/constants/subjects';
import { useRouter } from 'next/navigation';

export function SubjectJumpSection() {
  const router = useRouter();

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon name="school" size="sm" className="text-muted-foreground" />
        <h2 className="text-foreground text-base font-semibold">Jump to a subject</h2>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {SUBJECTS.map((s) => (
          <button
            key={s.key}
            onClick={() => router.push(`/student/library?subject=${encodeURIComponent(s.key)}`)}
            className="bg-card border-border hover:bg-muted text-card-foreground flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: s.color }}
            >
              <Icon name={s.iconName} size="sm" filled className="text-white" />
            </div>
            <span className="text-foreground text-[11px] leading-tight font-medium">
              {s.shortLabel}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
