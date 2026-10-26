'use client';

import { changePassword } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  redirectPath: string;
}

type Strength = 'weak' | 'fair' | 'strong';

function getPasswordStrength(password: string): Strength {
  if (password.length < 6) return 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (password.length >= 10 && score >= 3) return 'strong';
  if (password.length >= 8 && score >= 2) return 'fair';
  return 'weak';
}

function PasswordStrengthBar({ strength }: { strength: Strength }) {
  const config = {
    weak: { label: 'Weak', color: 'bg-destructive', segments: 1 },
    fair: { label: 'Fair', color: 'bg-yellow-500', segments: 2 },
    strong: { label: 'Strong', color: 'bg-green-500', segments: 3 },
  }[strength];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= config.segments ? config.color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{config.label} password</p>
    </div>
  );
}

export function ChangePasswordForm({ redirectPath }: ChangePasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fields, setFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (fields.newPassword !== fields.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await changePassword(fields.currentPassword, fields.newPassword);
      if (result.success) {
        toast.success('Password changed successfully.');
        router.push(redirectPath);
      } else {
        toast.error(result.error);
      }
    });
  };

  const strength = getPasswordStrength(fields.newPassword);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1.5 text-sm transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          Back
        </button>
        <h2 className="text-foreground text-2xl font-bold">Change Password</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your current password, then choose a new one.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-xl">
            <Icon name="lock" size="lg" filled />
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={fields.currentPassword}
                  onChange={(e) => setFields((f) => ({ ...f, currentPassword: e.target.value }))}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 -translate-y-1/2 transition-colors hover:bg-transparent dark:hover:bg-transparent"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showCurrent ? 'visibility_off' : 'visibility'} size="sm" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter a new password"
                  value={fields.newPassword}
                  onChange={(e) => setFields((f) => ({ ...f, newPassword: e.target.value }))}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 -translate-y-1/2 transition-colors hover:bg-transparent dark:hover:bg-transparent"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showCurrent ? 'visibility_off' : 'visibility'} size="sm" />
                </Button>
              </div>
              {fields.newPassword && <PasswordStrengthBar strength={strength} />}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={fields.confirmPassword}
                  onChange={(e) => setFields((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                  aria-invalid={
                    fields.confirmPassword.length > 0 &&
                    fields.confirmPassword !== fields.newPassword
                  }
                />
                <Button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 -translate-y-1/2 transition-colors hover:bg-transparent dark:hover:bg-transparent"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showCurrent ? 'visibility_off' : 'visibility'} size="sm" />
                </Button>
              </div>
              {fields.confirmPassword.length > 0 &&
                fields.confirmPassword !== fields.newPassword && (
                  <p className="text-destructive flex items-center gap-1 text-xs">
                    <Icon name="error" size="xs" />
                    Passwords do not match
                  </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Icon name="spinner" size="sm" className="animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <Icon name="lock_reset" size="sm" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
