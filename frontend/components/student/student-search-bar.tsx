import { Icon } from '@/components/ui/icon';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Reusable search input with icon and clear button.
 * Uses design-system tokens only — no hardcoded colours.
 */
export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative">
      <Icon
        name="search"
        size="md"
        className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-card text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-2xl border-2 py-3.5 pr-10 pl-12 text-sm shadow-sm transition-colors focus:ring-2 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2"
          aria-label="Clear search"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}
