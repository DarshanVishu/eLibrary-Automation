'use client';

import { bulkCreateUsers } from '@/app/admin/users/actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const VALID_ROLES = ['student', 'teacher', 'admin'] as const;

const newUserSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  email: z.email('Please enter a valid email address (e.g. name@domain.com).'),
  role: z.enum(VALID_ROLES),
  grade: z.string(),
  subject: z.string(),
});

type NewUser = z.infer<typeof newUserSchema>;

interface AddUserModalProps {
  initialRole?: 'student' | 'teacher' | 'admin';
  onClose: () => void;
}

export function AddUserModal({ initialRole = 'student', onClose }: AddUserModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    role: initialRole,
    email: '',
    grade: '9',
    subject: 'Mathematics',
  });

  const handleCreate = async () => {
    const result = newUserSchema.safeParse(newUser);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === 'email');
      if (emailIssue) setEmailError(emailIssue.message);
      return;
    }
    setIsPending(true);
    const res = await bulkCreateUsers([
      {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        grade: newUser.role === 'student' ? newUser.grade : undefined,
      },
    ]);
    setIsPending(false);

    // Surface per-user errors (e.g. duplicate email) inline on the field
    const userResult = res.results?.[0];
    if (userResult && !userResult.success) {
      const msg = userResult.error ?? '';
      const isDuplicate =
        msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists');
      setEmailError(
        isDuplicate ? `A user with this email already exists.` : `Could not create user: ${msg}`,
      );
      return;
    }

    if (res.success) {
      toast.success('Successfully created user!');
      onClose();
    } else {
      toast.error(`Error creating user: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="border-border bg-secondary w-full max-w-md overflow-hidden rounded-lg border shadow-xl">
        <div className="border-border/60 flex items-center justify-between border-b px-6 py-5">
          <h3 className="text-foreground text-lg font-bold">Add New User</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground h-8 w-8"
            aria-label="Close"
          >
            <Icon name="close" size="md" />
          </Button>
        </div>

        <div className="space-y-4 p-6">
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'E.g. Riya Sharma' },
            {
              label: 'Email Address',
              key: 'email',
              type: 'email',
              placeholder: 'riya.s@school.edu',
            },
          ].map((field) => (
            <div key={field.key}>
              <Label className="text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase">
                {field.label}
              </Label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={(newUser as any)[field.key]}
                onChange={(e) => {
                  setNewUser((n) => ({ ...n, [field.key]: e.target.value }) as NewUser);
                  if (field.key === 'email') setEmailError(null);
                }}
                className={`mt-2 h-10 px-4${
                  field.key === 'email' && emailError
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
                aria-invalid={field.key === 'email' && !!emailError}
                aria-describedby={field.key === 'email' ? 'email-error' : undefined}
              />
              {field.key === 'email' && emailError && (
                <p id="email-error" className="text-destructive mt-1.5 text-xs">
                  {emailError}
                </p>
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase">
                Role
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(role) =>
                  setNewUser((n) => ({ ...n, role: role as (typeof VALID_ROLES)[number] }))
                }
              >
                <SelectTrigger className="bg-card border-border text-foreground mt-2 h-10 w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newUser.role === 'student' ? (
              <div>
                <Label className="text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase">
                  Grade
                </Label>
                <Select
                  value={newUser.grade}
                  onValueChange={(grade) => setNewUser((n) => ({ ...n, grade }))}
                >
                  <SelectTrigger className="bg-card border-border text-foreground mt-2 h-10 w-full">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                      <SelectItem key={g} value={g.toString()}>
                        Grade {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : newUser.role === 'teacher' ? (
              <div>
                <Label className="text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase">
                  Subject
                </Label>
                <Select
                  value={newUser.subject}
                  onValueChange={(subject) => setNewUser((n) => ({ ...n, subject }))}
                >
                  <SelectTrigger className="bg-card border-border text-foreground mt-2 h-10 w-full">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {[
                      'Mathematics',
                      'Science',
                      'English',
                      'Hindi',
                      'Social Science',
                      'Computer Science',
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="mt-2 flex-1 font-bold"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} className="mt-2 flex-1 font-bold" disabled={isPending}>
              <Icon name="save" size="sm" filled className="mr-2" />
              {isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
