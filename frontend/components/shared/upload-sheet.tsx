'use client';

import { useUploads } from '@/components/providers/upload-provider';
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

function titleFromFileName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^.]+$/, '');
  return withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

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

interface UploadFormProps {
  onSuccess: () => void;
}

function UploadForm({ onSuccess }: UploadFormProps) {
  const { addUpload } = useUploads();
  const [dbSubjects, setDbSubjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getSubjectsList();
        if (data && data.length > 0) {
          setDbSubjects(data);
        }
      } catch {
        // Fallback handled in subjects memo
      }
    }
    loadSubjects();
  }, []);

  const subjects = useMemo(() => {
    if (dbSubjects.length > 0) return dbSubjects;
    return SUBJECTS.map((s, idx) => ({ id: `subject-${idx + 1}`, name: s.label }));
  }, [dbSubjects]);

  const [file, setFile] = useState<File | null>(null);
  const [bookId, setBookId] = useState('');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [grade, setGrade] = useState('');
  const [type, setType] = useState('textbook');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedInfo = e.target.files[0];
      if (selectedInfo.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        setFile(null);
        return;
      }
      if (selectedInfo.size > 524288000) {
        setError('File size cannot exceed 500MB');
        setFile(null);
        return;
      }
      setFile(selectedInfo);
      const extractedTitle = titleFromFileName(selectedInfo.name);
      setTitle(extractedTitle);
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!title || !subjectId || !grade || !type) {
      setError('Please fill out all fields.');
      return;
    }
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }

    try {
      addUpload({
        file,
        bookId: bookId.trim() || undefined,
        title,
        subjectId,
        grade,
        type,
      });
      onSuccess();
    } catch {
      setError('Failed to initiate upload.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="border-border bg-muted/20 hover:bg-muted/40 relative rounded-lg border-2 border-dashed p-6 text-center transition-colors">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="border-border bg-background mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border shadow-sm">
          <Icon name="upload" size="lg" filled className="text-foreground" />
        </div>
        <h3 className="text-foreground mb-1 line-clamp-1 text-sm font-bold">
          {file ? file.name : 'Drop your PDF here'}
        </h3>
        <p className="text-muted-foreground text-xs">
          {file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'or click to browse'}
        </p>
      </div>

      <Separator className="my-2" />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title" className="text-xs font-semibold">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Mathematics Textbook Class 9"
              className="mt-1.5 h-9"
            />
          </div>
          <div>
            <Label htmlFor="bookId" className="text-xs font-semibold">
              Book ID <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="bookId"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              placeholder="E.g. BK-MATH-09"
              className="mt-1.5 h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subject" className="text-xs font-semibold">
              Subject
            </Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subject" className="mt-1.5 h-9">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="grade" className="text-xs font-semibold">
              Grade
            </Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger id="grade" className="mt-1.5 h-9">
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

        <div>
          <Label htmlFor="type" className="text-xs font-semibold">
            Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type" className="mt-1.5 h-9">
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

        <div className="pt-2">
          <Button onClick={handleSubmit} className="w-full items-center gap-2 font-bold">
            <Icon name="upload" size="sm" />
            Start Upload
          </Button>
        </div>
      </div>
    </div>
  );
}

interface UploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadSheet({ open, onOpenChange }: UploadSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background w-full overflow-y-auto p-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Upload Material</SheetTitle>
          <SheetDescription>
            Add new study materials. The upload will continue in the background if you close this.
          </SheetDescription>
        </SheetHeader>

        {/*
           Rendering the form only when 'open' is true ensures that state
           is naturally reset every time the sheet is shown.
        */}
        {open && <UploadForm onSuccess={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}
