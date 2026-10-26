'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getSubjectsList } from '@/lib/actions/settings';
import { SUBJECTS } from '@/lib/constants';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const materialTypes = [
  { value: 'textbook', label: 'NCERT Textbook' },
  { value: 'guide', label: 'Guide / Study Notes' },
  { value: 'question_bank', label: 'Question Bank' },
  { value: 'reference', label: 'Reference Material' },
  { value: 'model_paper', label: 'Model Paper' },
  { value: 'sample_paper', label: 'Sample Paper' },
  { value: 'lab_material', label: 'Lab Material' },
  { value: 'others', label: 'Others' },
];

export interface EditMaterialInitialValues {
  id: string;
  bookId?: string | null;
  title: string;
  /** Subject name string, e.g. "Mathematics" */
  subject: string;
  /** Array of grade numbers, e.g. [6, 7]. All 10 grades → treated as "All Grades" */
  grades: number[];
  /** Raw material_type key, e.g. "textbook" */
  type: string;
}

export type UpdateMaterialMetadataAction = (params: {
  id: string;
  bookId?: string | null;
  title: string;
  subject: string;
  grade: number;
  type: string;
}) => Promise<{ success: true } | { success: false; error: string }>;

interface EditFormProps {
  initial: EditMaterialInitialValues;
  onSave: UpdateMaterialMetadataAction;
  onClose: () => void;
}

function EditForm({ initial, onSave, onClose }: EditFormProps) {
  const [dbSubjects, setDbSubjects] = useState<string[]>([]);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getSubjectsList();
        if (data && data.length > 0) {
          setDbSubjects(data.map((s) => s.name));
        }
      } catch {
        // Fallback handled in subjectsList
      }
    }
    loadSubjects();
  }, []);

  const subjectsList = useMemo(() => {
    const fallbackList = SUBJECTS.map((s) => s.label);
    const sourceList = dbSubjects.length > 0 ? dbSubjects : fallbackList;
    const combined = Array.from(new Set([...sourceList, initial.subject]))
      .filter(Boolean)
      .sort();
    return combined;
  }, [dbSubjects, initial.subject]);

  const initialGrade =
    initial.grades.length >= 10
      ? '0'
      : initial.grades.length === 1
        ? String(initial.grades[0])
        : '0';

  const [title, setTitle] = useState(initial.title);
  const [bookId, setBookId] = useState(initial.bookId ?? '');
  const [subject, setSubject] = useState(initial.subject);
  const [grade, setGrade] = useState(initialGrade);
  const [type, setType] = useState(initial.type);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!subject) {
      setError('Please select a subject.');
      return;
    }
    if (!grade) {
      setError('Please select a grade.');
      return;
    }
    if (!type) {
      setError('Please select a material type.');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const result = await onSave({
        id: initial.id,
        bookId: bookId.trim() || null,
        title: title.trim(),
        subject,
        grade: Number(grade),
        type,
      });

      if (result.success) {
        toast.success('Material updated successfully');
        onClose();
      } else {
        setError(result.error || 'Failed to save changes.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info banner */}
      <div className="bg-muted/40 border-border flex items-start gap-3 rounded-lg border p-3">
        <Icon name="info" className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-muted-foreground text-xs leading-relaxed font-medium">
          You can edit the metadata of this material. The PDF file itself cannot be changed — upload
          a new material if you need to replace the file.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        {/* Title + Book ID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-title" className="text-xs font-semibold">
              Title
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Mathematics Textbook Class 9"
              className="mt-1.5 h-9"
            />
          </div>
          <div>
            <Label htmlFor="edit-book-id" className="text-xs font-semibold">
              Book ID <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="edit-book-id"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              placeholder="E.g. BK-MATH-09"
              className="mt-1.5 h-9"
            />
          </div>
        </div>

        {/* Subject + Grade */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-subject" className="text-xs font-semibold">
              Subject
            </Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="edit-subject" className="mt-1.5 h-9">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectsList.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-grade" className="text-xs font-semibold">
              Grade
            </Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger id="edit-grade" className="mt-1.5 h-9">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Grades</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                  <SelectItem key={g} value={g.toString()}>
                    Class {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Type */}
        <div>
          <Label htmlFor="edit-type" className="text-xs font-semibold">
            Material Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="edit-type" className="mt-1.5 h-9">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {materialTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 font-semibold"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 items-center gap-2 font-bold"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Icon name="spinner" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon name="save" size="sm" />
            )}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditMaterialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EditMaterialInitialValues | null;
  onSave: UpdateMaterialMetadataAction;
}

export function EditMaterialSheet({ open, onOpenChange, initial, onSave }: EditMaterialSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background w-full overflow-y-auto p-6 sm:max-w-md">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-bold">Edit Material</SheetTitle>
          <SheetDescription>Update the metadata for this uploaded resource.</SheetDescription>
        </SheetHeader>

        {open && initial && (
          <EditForm initial={initial} onSave={onSave} onClose={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}
