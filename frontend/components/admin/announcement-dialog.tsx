'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendAnnouncement } from '@/lib/actions/notifications';
import type { AnnouncementAudience } from '@/lib/actions/notifications';
import { cn } from '@/lib/utils';
import { useState, useTransition } from 'react';

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AudienceOption = {
  value: AnnouncementAudience;
  label: string;
  desc: string;
  icon: string;
  color: string;
};

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    value: 'all',
    label: 'Everyone',
    desc: 'All active users',
    icon: 'people',
    color: 'text-primary',
  },
  {
    value: 'student',
    label: 'Students',
    desc: 'Active students only',
    icon: 'student',
    color: 'text-blue-500',
  },
  {
    value: 'teacher',
    label: 'Teachers',
    desc: 'Active teachers only',
    icon: 'school',
    color: 'text-emerald-500',
  },
  {
    value: 'admin',
    label: 'Admins',
    desc: 'Admin accounts only',
    icon: 'admin',
    color: 'text-amber-500',
  },
];

export function AnnouncementDialog({ open, onOpenChange }: AnnouncementDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [error, setError] = useState<string | null>(null);

  const isValid = title.trim().length > 0 && message.trim().length > 0;

  const handleClose = (nextOpen: boolean) => {
    if (isPending) return;
    if (!nextOpen) {
      setTitle('');
      setMessage('');
      setLink('');
      setAudience('all');
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError('Title and message are required.');
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await sendAnnouncement(title.trim(), message.trim(), audience, link.trim());
      if (!res.success) {
        setError(res.error || 'Failed to send announcement.');
        return;
      }
      handleClose(false);
    });
  };

  const selectedOption = AUDIENCE_OPTIONS.find((o) => o.value === audience)!;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Icon name="campaign" size="sm" className="text-primary" />
            </div>
            <DialogTitle>Send Announcement</DialogTitle>
          </div>
          <DialogDescription>
            Broadcast a realtime notification to users. It will appear instantly in their
            notification bell.
          </DialogDescription>
        </DialogHeader>

        <form id="announcement-form" onSubmit={handleSend} className="space-y-5">
          {/* Audience selector */}
          <div className="space-y-2">
            <Label>Audience</Label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAudience(opt.value)}
                  className={cn(
                    'border-border bg-card flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all',
                    audience === opt.value
                      ? 'border-primary bg-primary/5 ring-primary ring-1'
                      : 'hover:bg-muted/60',
                  )}
                >
                  <div
                    className={cn(
                      'bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                      audience === opt.value && 'bg-primary/10',
                    )}
                  >
                    <Icon name={opt.icon as any} size="sm" className={opt.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground text-xs leading-none font-bold">{opt.label}</p>
                    <p className="text-muted-foreground mt-0.5 truncate text-[10px]">{opt.desc}</p>
                  </div>
                  {audience === opt.value && (
                    <Icon name="check_circle" size="xs" className="text-primary ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ann-title"
              placeholder="e.g. School closure tomorrow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              autoComplete="off"
            />
            <p className="text-muted-foreground text-right text-[10px]">{title.length}/120</p>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="ann-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ann-message"
              placeholder="Write your announcement here…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-muted-foreground text-right text-[10px]">{message.length}/500</p>
          </div>

          {/* Optional link */}
          <div className="space-y-1.5">
            <Label htmlFor="ann-link" className="flex items-center gap-1">
              Link
              <span className="text-muted-foreground text-[10px] font-normal">(optional)</span>
            </Label>
            <Input
              id="ann-link"
              placeholder="/admin/library"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
              <Icon name="error" size="xs" />
              {error}
            </p>
          )}
        </form>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="announcement-form"
            disabled={isPending || !isValid}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Icon name="sync" size="xs" className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Icon name="send" size="xs" />
                Send to {selectedOption.label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
