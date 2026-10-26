import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FEATURES } from '@/lib/constants/dashboard';
import Image from 'next/image';
import Link from 'next/link';

export function AccessEverythingSection() {
  return (
    <section className="bg-card border-border text-card-foreground mt-6 grid grid-cols-1 items-center overflow-hidden rounded-[20px] border-[1.5px] transition-all duration-200 md:grid-cols-2">
      {/* Left — illustration */}
      <div className="bg-muted/30 relative flex h-72 items-end justify-center overflow-hidden md:h-full">
        {/* Soft amber glow */}
        <div
          className="bg-primary pointer-events-none absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full"
          style={{
            opacity: 0.18,
          }}
        />
        <Image
          src="/images/student/hero.png"
          alt="Access everything illustration"
          width={380}
          height={380}
          className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-md"
        />
      </div>

      {/* Right — text */}
      <div className="px-8 py-10">
        <p className="text-primary mb-1 text-[10px] font-black tracking-widest uppercase">
          Everything you need
        </p>
        <h2 className="text-foreground mb-3 text-3xl leading-snug font-black">
          Access to everything,
          <br />
          <span className="text-primary">for everyone</span>
        </h2>
        <p className="text-muted-foreground mb-5 max-w-sm text-sm leading-relaxed">
          Easy, secure access to digital learning resources for every grade and subject — all in one
          place, always available.
        </p>
        <ul className="mb-6 space-y-3">
          {FEATURES.map((f) => (
            <li
              key={f.label}
              className="text-foreground/80 flex items-center gap-2.5 text-sm font-semibold"
            >
              <span className="bg-primary/20 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                <Icon name={f.icon} size="xs" className="text-primary" />
              </span>
              {f.label}
            </li>
          ))}
        </ul>
        <Button asChild className="rounded-2xl">
          <Link href="/student/library">
            Browse Library
            <Icon name="chevron_right" size="xs" className="text-primary-foreground" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
