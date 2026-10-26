'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';

interface SignInSubmitProps {
  form: UseFormReturn<any>;
}

export function SignInSubmit({ form }: SignInSubmitProps) {
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Button
      type="submit"
      className="mt-1 w-full py-5 font-semibold"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      <span className={cn('flex items-center justify-center gap-2', isSubmitting && 'opacity-90')}>
        {isSubmitting && <Icon name="spinner" size="sm" className="animate-spin" />}
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </span>
    </Button>
  );
}
