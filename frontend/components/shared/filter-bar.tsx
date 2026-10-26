'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/components/ui/utils';
import * as React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FilterOption = {
  value: string;
  label: string;
  icon?: IconName;
  count?: number;
};

/**
 * A single filter group rendered inside the popover panel.
 *
 * `select`       → renders a `<Select>` dropdown
 * `toggle-group` → renders a row of small toggle buttons (good for Role/Performance)
 * `badge-toggle` → renders badge pill toggles (good for Progress status)
 * `boolean`      → renders a single on/off badge (e.g. "Bookmarked")
 */
export type FilterGroupType = 'select' | 'toggle-group' | 'badge-toggle' | 'boolean';

export interface FilterGroup {
  key: string;
  label: string;
  icon?: IconName;
  type: FilterGroupType;
  options: FilterOption[];
  /** Current selected value. Use `null` / empty-string for "no filter applied". */
  value: string | null;
  onChange: (value: string | null) => void;
  /** For boolean type: label for the "on" state (e.g. "Saved") */
  booleanLabel?: string;
  /** For boolean type: icon shown in the badge */
  booleanIcon?: IconName;
}

export interface FilterBarProps {
  /** Current search query value */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter groups that appear inside the popover */
  filters: FilterGroup[];
  /** Total result count displayed next to the filter button */
  resultCount?: number;
  /** Label after result count (default: "results") */
  resultLabel?: string;
  /** Buttons/actions rendered to the right of the filter trigger (e.g. Upload, Add User) */
  actions?: React.ReactNode;
  /** Called when "Clear all" is clicked inside the popover */
  onClearAll?: () => void;
  /** Overrides the computed active-filter count when you manage it externally */
  activeFilterCount?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeActiveCount(filters: FilterGroup[]): number {
  return filters.filter((f) => {
    if (f.type === 'boolean') return f.value === 'true';
    return !!f.value && f.value !== '' && f.value !== 'all';
  }).length;
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  resultCount,
  resultLabel = 'results',
  actions,
  onClearAll,
  activeFilterCount,
  className,
}: FilterBarProps) {
  const [open, setOpen] = React.useState(false);

  const activeCount = activeFilterCount ?? computeActiveCount(filters);

  const handleClearAll = () => {
    onClearAll?.();
    setOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* ── Search input ── */}
      <div className="relative min-w-0 flex-1">
        <Icon
          name="search"
          size="sm"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <Input
          placeholder={searchPlaceholder}
          className="h-9 w-full pr-8 pl-9 text-sm font-medium shadow-none"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
            aria-label="Clear search"
          >
            <Icon name="close_small" size="sm" />
          </button>
        )}
      </div>

      {/* ── Filter popover trigger ── */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5 font-medium"
            aria-label="Open filters"
          >
            <Icon name="tune" size="sm" />
            Filters
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {activeCount}
              </span>
            )}
            <Icon
              name="keyboard_arrow_down"
              size="sm"
              className={cn('transition-transform duration-150', open && 'rotate-180')}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" sideOffset={6} className="w-72 p-0">
          {/* Popover header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Filters</span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter groups */}
          <div className="divide-border/60 divide-y px-4 py-1">
            {filters.map((group) => (
              <FilterGroupRow key={group.key} group={group} />
            ))}
          </div>

          {/* Result count footer */}
          {resultCount !== undefined && (
            <div className="border-t px-4 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <Icon name="filter_list" size="sm" />
                {resultCount} {resultLabel}
              </span>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* ── Optional action buttons slot ── */}
      {actions}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterGroupRow — renders a single filter group inside the popover
// ---------------------------------------------------------------------------

function FilterGroupRow({ group }: { group: FilterGroup }) {
  return (
    <div className="py-3">
      <div className="mb-2 flex items-center gap-1.5">
        {group.icon && <Icon name={group.icon} size="sm" className="text-muted-foreground" />}
        <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
          {group.label}
        </span>
      </div>

      {group.type === 'select' && (
        <Select
          value={group.value ?? 'all'}
          onValueChange={(v) => group.onChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className="h-8 w-full text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {group.label}</SelectItem>
            {group.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-1.5">
                  {opt.icon && <Icon name={opt.icon} size="xs" />}
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className="text-muted-foreground ml-auto text-xs">({opt.count})</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {group.type === 'toggle-group' && (
        <div className="flex flex-wrap gap-1.5">
          {group.options.map((opt) => {
            const active = group.value === opt.value;
            return (
              <Button
                key={opt.value}
                variant={active ? 'default' : 'outline'}
                size="sm"
                className="h-7 gap-1 px-2.5 text-xs font-medium capitalize"
                onClick={() => group.onChange(active ? null : opt.value)}
              >
                {opt.icon && <Icon name={opt.icon} size="xs" filled={active} />}
                {opt.label}
                {opt.count !== undefined && (
                  <span
                    className={cn(
                      'ml-0.5 text-[10px]',
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {group.type === 'badge-toggle' && (
        <div className="flex flex-wrap gap-1.5">
          {group.options.map((opt) => {
            const active = group.value === opt.value;
            return (
              <Badge
                key={opt.value}
                variant={active ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => group.onChange(active ? null : opt.value)}
              >
                {opt.icon && <Icon name={opt.icon} size="xs" className="mr-0.5" />}
                {opt.label}
              </Badge>
            );
          })}
        </div>
      )}

      {group.type === 'boolean' && (
        <div>
          <Badge
            variant={group.value === 'true' ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() => group.onChange(group.value === 'true' ? null : 'true')}
          >
            {group.booleanIcon && (
              <Icon
                name={group.booleanIcon}
                size="xs"
                filled={group.value === 'true'}
                className="mr-0.5"
              />
            )}
            {group.booleanLabel ?? group.label}
          </Badge>
        </div>
      )}
    </div>
  );
}
