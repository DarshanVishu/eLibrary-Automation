import { Icon } from '@/components/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { VIEWER_COLORS } from '@/lib/constants/viewer';
import React from 'react';

interface NoteEditFormProps {
  page: number;
  editContent: string;
  setEditContent: (v: string) => void;
  editColor: string;
  setEditColor: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  displayBorder: string;
}

export function NoteEditForm({
  page,
  editContent,
  setEditContent,
  editColor,
  setEditColor,
  onSave,
  onCancel,
  displayBorder,
}: NoteEditFormProps) {
  return (
    <div
      className={`group bg-card relative rounded-xl border p-3 shadow-sm transition-all ${displayBorder}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-bold">Editing page {page}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: VIEWER_COLORS.find((c) => c.name === editColor)?.rgb }}
              title="Change color"
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <div className="flex gap-1">
              {VIEWER_COLORS.map((c) => (
                <button
                  key={c.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: c.rgb }}
                  onClick={() => setEditColor(c.name)}
                >
                  {editColor === c.name && (
                    <Icon name="check" size="xs" className="text-black/50" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        className="bg-background text-foreground min-h-[100px] w-full resize-none text-sm focus-visible:ring-1"
        placeholder="Write your note..."
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:bg-muted rounded px-3 py-1.5 text-xs font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!editContent.trim()}
          className="bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
