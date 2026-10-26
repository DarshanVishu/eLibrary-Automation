import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';

export function CtaBannerSection() {
  return (
    <section className="from-primary via-primary to-primary/80 dark:bg-card border-border relative mt-6 overflow-hidden rounded-[20px] bg-linear-to-br px-8 py-12 text-center transition-all duration-200 dark:border dark:bg-none">
      {/* Decorative circles */}
      <span className="dark:bg-primary/5 pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
      <span className="dark:bg-primary/5 pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rotate-12 rounded-[60px] bg-white/10" />
      <span className="dark:bg-primary/10 pointer-events-none absolute top-6 left-1/3 h-3 w-3 rotate-45 rounded-sm bg-white/30 dark:shadow-[0_0_8px_var(--orange-primary)]" />
      <span className="dark:bg-primary/20 pointer-events-none absolute right-1/4 bottom-8 h-2 w-2 rounded-full bg-white/40" />

      {/* Icon */}
      <div className="relative mb-4 flex justify-center">
        <span className="dark:bg-primary/20 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
          <Icon name="library" size="xl" className="dark:text-primary text-white" filled />
        </span>
      </div>

      {/* Label */}
      <p className="dark:text-primary relative mb-2 text-xs font-black tracking-widest text-white/70 uppercase">
        Start Today
      </p>

      {/* Heading */}
      <h2 className="dark:text-foreground relative mb-2 text-2xl font-black text-white md:text-3xl">
        Ready to start reading?
      </h2>
      <p className="dark:text-muted-foreground relative mx-auto mb-7 max-w-sm text-sm leading-relaxed text-white/75">
        Thousands of books, guides, and question papers — all free for students. Jump in now.
      </p>

      {/* CTA */}
      <Button asChild className="relative rounded-[20px] px-8 py-3.5">
        <Link href="/student/library">
          <Icon name="library" size="sm" filled />
          Browse Library
        </Link>
      </Button>
    </section>
  );
}
