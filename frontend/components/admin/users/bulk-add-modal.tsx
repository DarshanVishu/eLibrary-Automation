'use client';

import { bulkCreateUsers } from '@/app/admin/users/actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

interface BulkAddModalProps {
  onClose: () => void;
}

const emailSchema = z.email();

export function BulkAddModal({ onClose }: BulkAddModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [bulkUsersText, setBulkUsersText] = useState('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const handleBulkCreate = async () => {
    if (!bulkUsersText.trim()) return;
    setCsvErrors([]);
    setIsPending(true);

    const lines = bulkUsersText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsedUsers = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map((s) => s?.trim() || '');
      if (!parts[0]) {
        errors.push(`Line ${i + 1}: Missing email.`);
        continue;
      }
      const email = parts[0];
      if (!emailSchema.safeParse(email).success) {
        errors.push(`Line ${i + 1}: Invalid email "${email}".`);
        continue;
      }
      const name = parts[1] || email.split('@')[0];
      const roleStr = (parts[2] || '').toLowerCase();
      if (!roleStr || !(['student', 'teacher', 'admin'] as const).includes(roleStr as any)) {
        errors.push(
          `Line ${i + 1}: Invalid or missing role "${roleStr || '(empty)'}". Must be student, teacher, or admin.`,
        );
        continue;
      }
      const role = roleStr as 'student' | 'teacher' | 'admin';
      let gradeStr = parts[3] || undefined;
      if (role === 'student' && gradeStr) {
        const g = parseInt(gradeStr, 10);
        if (isNaN(g) || g < 1 || g > 10) {
          errors.push(`Line ${i + 1}: Invalid grade "${gradeStr}".`);
          continue;
        }
      } else if (role !== 'student') {
        gradeStr = undefined;
      }
      parsedUsers.push({ email, name, role, grade: gradeStr });
    }

    // Detect duplicates within the submitted batch itself
    const emailSet = new Set<string>();
    for (const u of parsedUsers) {
      if (emailSet.has(u.email.toLowerCase())) {
        errors.push(`Duplicate email in CSV: "${u.email}" appears more than once.`);
      } else {
        emailSet.add(u.email.toLowerCase());
      }
    }

    if (errors.length > 0) {
      setCsvErrors(errors);
      setIsPending(false);
      return;
    }
    if (parsedUsers.length === 0) {
      toast.error('No valid users found.');
      setIsPending(false);
      return;
    }

    const res = await bulkCreateUsers(parsedUsers);
    setIsPending(false);

    // Surface per-user backend failures (e.g. duplicate with existing account)
    if (res.results && res.results.some((r) => !r.success)) {
      const backendErrors = res.results
        .filter((r) => !r.success)
        .map((r) => {
          const msg = r.error ?? 'Unknown error';
          const isDuplicate =
            msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists');
          return isDuplicate ? `"${r.email}" already exists — skipped.` : `"${r.email}": ${msg}`;
        });
      setCsvErrors(backendErrors);
    }

    const succeeded = res.results?.filter((r) => r.success).length ?? 0;
    if (res.partial) {
      toast.warning(`${succeeded} of ${parsedUsers.length} users created. See errors below.`);
    } else if (res.success) {
      toast.success(`Successfully created ${parsedUsers.length} users!`);
      onClose();
    } else {
      toast.error(`Error: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="border-border bg-secondary w-full max-w-2xl overflow-hidden rounded-lg border shadow-xl">
        <div className="border-border/60 flex items-center justify-between border-b px-6 py-5">
          <h3 className="text-foreground text-lg font-bold">Bulk Create Users</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground h-8 w-8"
            disabled={isPending}
            aria-label="Close"
          >
            <Icon name="close" size="md" />
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div className="bg-muted text-muted-foreground rounded-md p-4 text-sm font-medium">
            <p className="text-foreground mb-2 font-bold">Paste user data in CSV format:</p>
            <code className="bg-background/50 border-border block rounded border p-2">
              email,name,role,grade
            </code>
            <ul className="mt-2 list-inside list-disc pl-1 text-xs opacity-80">
              <li>
                <strong>role:</strong> `student`, `teacher`, or `admin` (defaults to student)
              </li>
              <li>
                <strong>grade:</strong> 1-10 (optional, only for students)
              </li>
            </ul>
          </div>

          <textarea
            className={`bg-background border-border text-foreground focus:ring-primary/20 h-48 w-full rounded-md border p-3 font-mono text-sm shadow-sm focus:ring-2 focus:outline-none${
              csvErrors.length > 0 ? 'border-destructive' : ''
            }`}
            placeholder={`student1@school.edu, John Doe, student, 9\nteacher1@school.edu, Jane Smith, teacher\nadmin@school.edu, Super Admin, admin`}
            value={bulkUsersText}
            onChange={(e) => {
              setBulkUsersText(e.target.value);
              if (csvErrors.length > 0) setCsvErrors([]);
            }}
            disabled={isPending}
          />

          {csvErrors.length > 0 && (
            <div
              role="alert"
              aria-live="polite"
              className="border-destructive/40 bg-destructive/10 rounded-md border p-3"
            >
              <p className="text-destructive mb-1.5 flex items-center gap-1.5 text-xs font-bold">
                <Icon name="error" size="sm" />
                {csvErrors.length} error{csvErrors.length > 1 ? 's' : ''} found — fix and try again
              </p>
              <ul className="text-destructive space-y-0.5 text-xs opacity-90">
                {csvErrors.map((err, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="shrink-0">•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="mt-2 flex-1 font-bold"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              className="mt-2 flex-1 font-bold"
              disabled={isPending}
            >
              <Icon name="upload" size="sm" filled className="mr-2" />
              {isPending ? 'Processing...' : 'Bulk Create Users'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
