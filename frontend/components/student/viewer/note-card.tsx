// Fix #3: Trash2 was imported from student-icons (a thin wrapper). Use Icon directly.
import { NoteEditForm } from '@/components/student/viewer/note-edit-form';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VIEWER_COLORS } from '@/lib/constants/viewer';
import { NoteRecord } from '@/lib/types/viewer';
import React, { useState } from 'react';

export function NoteCard({
  note,
  onDelete,
  onJump,
  onUpdate,
}: {
  note: NoteRecord;
  onDelete: () => void;
  onJump: () => void;
  onUpdate: (id: string, updates: Partial<NoteRecord['annotation_data']>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const data = note.annotation_data;
  const isHighlight = data.type === 'highlight' || data.type === 'area';

  const [editContent, setEditContent] = useState(data.note || '');
  const [editColor, setEditColor] = useState(data.color || 'yellow');

  const text = isHighlight ? data.text || 'Area selection' : data.note || '';
  const isLong = text && text.length > 150;

  const colorObj =
    VIEWER_COLORS.find((c) => c.name === (isHighlight ? data.color : data.color || 'yellow')) ||
    VIEWER_COLORS[0];
  const displayBg = isHighlight ? colorObj.bg : 'bg-transparent';
  const displayBorder = isHighlight ? 'border-border' : `border-l-4 ${colorObj.border}`;

  const handleSave = () => {
    onUpdate(note.id, { note: editContent, color: editColor, updatedAt: new Date().toISOString() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(data.note || '');
    setEditColor(data.color || 'yellow');
    setIsEditing(false);
  };

  if (isEditing && !isHighlight) {
    return (
      <NoteEditForm
        page={data.page || 1}
        editContent={editContent}
        setEditContent={setEditContent}
        editColor={editColor}
        setEditColor={setEditColor}
        onSave={handleSave}
        onCancel={handleCancel}
        displayBorder={displayBorder}
      />
    );
  }

  return (
    <div
      className={`group bg-card relative rounded-xl border p-3 shadow-sm transition-all hover:shadow-md ${displayBorder}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <button
          onClick={onJump}
          className={`${displayBg} ${!isHighlight ? 'text-foreground hover:text-primary' : ''} rounded px-2 py-0.5 text-xs font-bold hover:underline`}
        >
          {isHighlight ? (data.type === 'highlight' ? 'Highlight' : 'Area') : 'Note'} · Page{' '}
          {data.page}
        </button>
        <div className="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
          {!isHighlight && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1"
                  aria-label="Edit note"
                >
                  <Icon name="edit" size="sm" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Edit note</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-destructive hover:bg-destructive/10 rounded p-1"
                aria-label="Delete note"
              >
                <Icon name="trash2" size="sm" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <p
        className={`text-foreground text-sm leading-relaxed whitespace-pre-wrap ${!isHighlight ? 'font-serif' : 'italic'} ${!expanded && isLong ? 'line-clamp-3' : ''}`}
      >
        {isHighlight && data.type === 'highlight' ? `"${text}"` : text}
      </p>
      <div className="mt-2 flex items-center justify-between">
        {isLong ? (
          <button
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-semibold"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Read less' : '▼ Read more'}
          </button>
        ) : (
          <span />
        )}
        {data.updatedAt && (
          <span className="text-muted-foreground text-[10px] italic">
            Edited {new Date(data.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
