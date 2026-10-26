import { Icon } from '@/components/ui/icon';
import { TESTIMONIALS } from '@/lib/constants/dashboard';

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name={i <= count ? 'star' : 'star_outline'}
          size="xs"
          filled={i <= count}
          className={i <= count ? 'text-primary' : 'text-muted'}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="mt-10">
      <div className="mb-5 text-center">
        <p className="text-primary mb-1 text-xs font-black tracking-widest uppercase">
          Testimonials
        </p>
        <h2 className="text-foreground text-2xl font-black">What Parents say</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="bg-card border-border rounded-2xl border p-5 shadow-sm">
            <StarRating count={t.stars} />
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed italic">"{t.text}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow">
                <Icon name="person" size="sm" filled />
              </div>
              <div>
                <p className="text-foreground text-sm font-black">{t.name}</p>
                <p className="text-muted-foreground text-[11px]">Parent · Grade {t.grade}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
