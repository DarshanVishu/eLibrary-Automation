import { Icon } from '@/components/ui/icon';
import { PROGRAMS } from '@/lib/constants/dashboard';

export function ProgramsSection() {
  return (
    <section className="bg-card border-border text-card-foreground mt-6 rounded-[20px] border-[1.5px] px-8 py-8 transition-all duration-200">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <span className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
          <Icon name="books" size="sm" className="text-primary-foreground" filled />
        </span>
        <div>
          <p className="text-primary text-[10px] font-black tracking-widest uppercase">
            What we offer
          </p>
          <h2 className="text-foreground text-lg font-black">Our Programs</h2>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PROGRAMS.map((p) => (
          <div
            key={p.label}
            className="border-border bg-muted/20 flex items-start gap-4 rounded-[20px] border px-5 py-5 transition-colors"
          >
            <div
              className={`bg-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm`}
            >
              <Icon name={p.icon} size="md" className="text-primary-foreground" filled />
            </div>
            <div>
              <p className="text-foreground text-sm font-black">{p.label}</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
