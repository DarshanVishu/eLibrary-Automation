import { Icon } from '@/components/ui/icon';
import type { ReactNode } from 'react';

export function FloatingSparkles() {
  return (
    <div className="pointer-events-none select-none" aria-hidden="true">
      {/* Large sparkle top-right */}
      <span className="absolute top-6 right-10 animate-pulse text-3xl text-yellow-300 opacity-80">
        ✦
      </span>
      {/* Small sparkle top-left */}
      <span
        className="absolute top-12 left-16 text-lg text-pink-300 opacity-70"
        style={{ animationDelay: '0.5s' }}
      >
        ✧
      </span>
      {/* Medium sparkle bottom-left */}
      <span
        className="absolute bottom-8 left-8 animate-pulse text-2xl text-blue-300 opacity-60"
        style={{ animationDelay: '1s' }}
      >
        ✦
      </span>
      {/* Small sparkle center-right */}
      <span
        className="absolute top-1/2 right-6 animate-pulse text-sm text-purple-300 opacity-70"
        style={{ animationDelay: '0.7s' }}
      >
        <Icon name="sparkles" className="h-3 w-3" />
      </span>
      {/* Tiny dot top-center */}
      <span className="absolute top-3 left-1/2 text-xs text-green-300 opacity-60">●</span>
      {/* Cross sparkle bottom-right */}
      <span
        className="absolute right-1/4 bottom-6 animate-pulse text-xl text-orange-300 opacity-70"
        style={{ animationDelay: '1.3s' }}
      >
        ✦
      </span>
    </div>
  );
}

export function PageSparkles() {
  const sparkles = [
    { top: '8%', left: '3%', color: 'text-yellow-500', size: 'text-2xl', delay: '0s' },
    { top: '5%', left: '92%', color: 'text-red-500', size: 'text-xl', delay: '0.4s' },
    { top: '18%', left: '88%', color: 'text-blue-400', size: 'text-base', delay: '0.8s' },
    { top: '32%', left: '1%', color: 'text-green-500', size: 'text-xl', delay: '1.2s' },
    { top: '45%', left: '96%', color: 'text-green-600', size: 'text-sm', delay: '0.6s' },
    { top: '58%', left: '4%', color: 'text-red-600', size: 'text-2xl', delay: '1s' },
    { top: '70%', left: '91%', color: 'text-orange-400', size: 'text-lg', delay: '0.3s' },
    { top: '82%', left: '2%', color: 'text-red-500', size: 'text-xl', delay: '1.5s' },
    { top: '90%', left: '93%', color: 'text-blue-300', size: 'text-base', delay: '0.9s' },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {sparkles.map((s, i) => (
        <span
          key={i}
          className={`absolute ${s.color} ${s.size} animate-pulse opacity-40`}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

interface SubjectCardProps {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  shadowColor: string;
  onClick?: () => void;
}

export function SubjectCard({ icon, label, gradient, shadowColor, onClick }: SubjectCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-2xl p-4 ${gradient} cursor-pointer border-0 shadow-lg transition-all duration-200 outline-none hover:scale-105 active:scale-95`}
      style={{ boxShadow: `0 8px 20px ${shadowColor}` }}
    >
      <div className="text-white opacity-90">{icon}</div>
      <span className="text-center text-xs leading-tight font-semibold text-white drop-shadow">
        {label}
      </span>
    </button>
  );
}

export function FunBadge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${color} shadow-sm`}
    >
      {children}
    </span>
  );
}
