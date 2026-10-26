'use client';

import { buttonVariants } from './button';
import { Icon } from './icon';
import { cn } from './utils';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row',
        month: 'flex flex-col gap-4 relative',
        month_caption: 'flex justify-center relative items-center h-7 w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute left-3 top-3 z-10',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute right-3 top-3 z-10',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex w-full',
        weekday:
          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center flex-1',
        weeks: 'w-full',
        week: 'flex w-full mt-2 justify-between',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 h-8 w-8 flex items-center justify-center',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors flex items-center justify-center',
        ),
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground font-semibold',
        outside: '[&>button]:text-muted-foreground [&>button]:opacity-40',
        disabled:
          '[&>button]:text-muted-foreground [&>button]:opacity-30 [&>button]:pointer-events-none',
        range_start: 'bg-primary text-primary-foreground rounded-l-md',
        range_end: 'bg-primary text-primary-foreground rounded-r-md',
        range_middle: 'bg-accent text-accent-foreground rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) => {
          const name = orientation === 'left' ? 'chevron_left' : 'chevron_right';
          return <Icon name={name} size="sm" className={cn('size-4', className)} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
