/**
 * WHY THIS FILE WAS REFACTORED (Fix #3)
 *
 * Previously imported `Highlighter` and `X` from student-icons.tsx — thin
 * wrappers that added a pointless indirection layer:
 *
 *   notes-sidebar → student-icons → Icon
 *
 * Fix: use <Icon> directly. Identical runtime output, one fewer dependency.
 */
import { NoteCard } from '@/components/student/viewer/note-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NoteRecord } from '@/lib/types/viewer';
import React from 'react';

interface NotesSidebarProps {
  notes: NoteRecord[];
  onClose: () => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<NoteRecord['annotation_data']>) => void;
  jumpToAnnotation: (page: number, id?: string) => void;
}

export function NotesSidebar({
  notes,
  onClose,
  deleteNote,
  updateNote,
  jumpToAnnotation,
}: NotesSidebarProps) {
  return (
    <>
      <div className="bg-secondary flex flex-shrink-0 items-center justify-between px-4 py-3">
        <div className="min-w-0 overflow-hidden pr-2">
          <h3 className="text-foreground truncate text-sm font-bold">Document Notes</h3>
          <p className="text-muted-foreground truncate text-xs">
            {notes.length} annotation{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground rounded"
              aria-label="Close notes panel"
            >
              <Icon name="close" size="sm" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close notes</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="highlights" className="flex h-full w-full flex-col gap-0">
          <div className="border-border bg-secondary flex-shrink-0 border-b px-4 pb-3">
            <TabsList className="w-full">
              <TabsTrigger value="highlights" className="flex-1">
                Highlights ({notes.filter((n) => n.annotation_data.type !== 'note').length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                Notes ({notes.filter((n) => n.annotation_data.type === 'note').length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-background flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4">
            <TabsContent
              value="highlights"
              className="m-0 flex-1 space-y-3 focus-visible:outline-none"
            >
              {notes.filter((n) => n.annotation_data.type !== 'note').length === 0 ? (
                <div className="border-border bg-card text-muted-foreground mt-10 rounded-2xl border p-6 px-4 text-center text-sm leading-relaxed shadow-sm">
                  <Icon name="highlighter" size="xl" className="text-primary/60 mx-auto mb-3" />
                  <p className="text-foreground mb-1 font-bold">No highlights yet</p>
                  <p>Select text on the document to create a highlight.</p>
                </div>
              ) : (
                notes
                  .filter((n) => n.annotation_data.type !== 'note')
                  .map((n) => (
                    <NoteCard
                      key={n.id}
                      note={n}
                      onDelete={() => deleteNote(n.id)}
                      onJump={() => jumpToAnnotation(n.annotation_data.page || 1, n.id)}
                      onUpdate={updateNote}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value="notes" className="m-0 flex-1 space-y-3 focus-visible:outline-none">
              {notes.filter((n) => n.annotation_data.type === 'note').length === 0 ? (
                <div className="border-border bg-card text-muted-foreground mt-10 rounded-2xl border p-6 px-4 text-center text-sm leading-relaxed shadow-sm">
                  <Icon name="sticky_note" size="xl" className="text-primary/60 mx-auto mb-3" />
                  <p className="text-foreground mb-1 font-bold">No notes yet</p>
                  <p>
                    Click <strong className="text-foreground">Add Note</strong> to jot down your
                    thoughts.
                  </p>
                </div>
              ) : (
                notes
                  .filter((n) => n.annotation_data.type === 'note')
                  .map((n) => (
                    <NoteCard
                      key={n.id}
                      note={n}
                      onDelete={() => deleteNote(n.id)}
                      onJump={() => jumpToAnnotation(n.annotation_data.page || 1, n.id)}
                      onUpdate={updateNote}
                    />
                  ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
