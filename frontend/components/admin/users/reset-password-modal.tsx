'use client';

import { resetUserPassword } from '@/app/admin/users/actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface ResetPasswordModalProps {
  user: { id: string; name: string; role: string };
  onClose: () => void;
}

type Strength = 'weak' | 'fair' | 'strong';

export function getPasswordStrength(password: string): Strength {
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

export function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(newPassword);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await resetUserPassword(user.id, newPassword);
      if (result.success) {
        toast.success(`Password reset for ${user.name}.`);
        onClose();
      } else {
        toast.error(result.error ?? 'Failed to reset password.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="border-border bg-secondary w-full max-w-md overflow-hidden rounded-lg border shadow-xl">
        {/* Header */}
        <div className="border-border/60 flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Icon name="lock_reset" size="md" filled />
            </div>
            <div>
              <h3 className="text-foreground text-base font-bold">Reset Password</h3>
              <p className="text-muted-foreground text-xs capitalize">
                {user.role} · {user.name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <Icon name="close" size="md" />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              New Password
            </Label>
            <div className="relative mt-2">
              <Input
                type={showNew ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-10 pr-10"
              />
              <Button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 -translate-y-1/2 transition-colors hover:bg-transparent dark:hover:bg-transparent"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                <Icon name={showNew ? 'visibility_off' : 'visibility'} size="sm" />
              </Button>
            </div>
            {newPassword && <PasswordStrengthBar strength={strength} />}
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Confirm Password
            </Label>
            <div className="relative mt-2">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-10 pr-10"
                aria-invalid={mismatch}
              />
              <Button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 -translate-y-1/2 transition-colors hover:bg-transparent dark:hover:bg-transparent"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size="sm" />
              </Button>
            </div>
            {mismatch && (
              <p className="text-destructive flex items-center gap-1 text-xs">
                <Icon name="error" size="xs" />
                Passwords do not match
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 font-bold">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 font-bold">
              {isPending ? (
                <>
                  <Icon name="spinner" size="sm" className="animate-spin" />
                  Resetting…
                </>
              ) : (
                <>
                  <Icon name="lock_reset" size="sm" filled />
                  Reset Password
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
