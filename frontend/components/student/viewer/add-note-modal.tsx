// Fix #3: X was imported from student-icons (a thin wrapper around Icon name="close").
// Import Icon directly to remove the unnecessary indirection layer.
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState } from 'react';

export function AddNoteModal({
  onConfirm,
  onCancel,
  defaultPage,
}: {
  onConfirm: (page: number, note: string) => void;
  onCancel: () => void;
  defaultPage: number;
}) {
  const [page, setPage] = useState<number | ''>(defaultPage || 1);
  const [note, setNote] = useState('');

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="bg-card text-card-foreground border-border w-[400px] rounded-2xl border p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-bold">Add Note</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close add note dialog"
              >
                <Icon name="close" size="sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close</TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
              Page Number
            </Label>
            <Input
              type="number"
              min={1}
              value={page}
              onChange={(e) => setPage(parseInt(e.target.value) || '')}
              placeholder="e.g. 1"
            />
          </div>

          <div>
            <Label className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
              Your Note
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your thoughts here..."
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            onClick={() => {
              if (page && typeof page === 'number' && note.trim()) {
                onConfirm(page, note.trim());
              }
            }}
            disabled={!page || !note.trim()}
            className="flex-1 py-2.5 text-sm font-bold"
          >
            Save Note
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
