'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRef, useState } from 'react';

interface Subject {
  id: number;
  name: string;
}

interface UploadModalProps {
  subjects: Subject[];
  onClose: () => void;
  onSubmit: (params: {
    file: File;
    bookId?: string;
    title: string;
    subjectId: string;
    grade: string;
    type: string;
  }) => void;
}

export function UploadModal({ subjects, onClose, onSubmit }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bookId, setBookId] = useState('');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [grade, setGrade] = useState('');
  const [type, setType] = useState('textbook');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDummyFileSelect = () => {
    const dummyPDF =
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n189\n%%EOF';
    const fileName = title ? `${title.replace(/\s+/g, '_')}.pdf` : 'Mathematics_Study_Material.pdf';
    setSelectedFile(new File([dummyPDF], fileName, { type: 'application/pdf' }));
  };

  const handleSubmit = () => {
    if (!title || !subjectId || !grade || !type) {
      setError('Please fill out all fields.');
      return;
    }

    let fileToUpload = selectedFile;
    if (!fileToUpload) {
      const dummyContent =
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n189\n%%EOF';
      const fileName = title
        ? `${title.replace(/\s+/g, '_')}.pdf`
        : 'Mathematics_Study_Material.pdf';
      fileToUpload = new File([dummyContent], fileName, { type: 'application/pdf' });
    }

    onSubmit({
      file: fileToUpload,
      bookId: bookId.trim() || undefined,
      title,
      subjectId,
      grade,
      type,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Upload New Material</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="close" className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onClick={handleDummyFileSelect}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileSelect}
            />
            <Icon name="upload" className="text-muted-foreground mb-3 h-8 w-8" />
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-muted-foreground text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm">Click to select a file</p>
                <p className="text-muted-foreground text-xs">PDF only · Max 50 MB</p>
              </>
            )}
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Maths Question Bank"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs">
                Book ID <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Input
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder="E.g. BK-MATH-09"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs">Subject</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs">Grade</label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs">Material Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="textbook">NCERT Textbook</SelectItem>
                  <SelectItem value="guide">Guide / Study Notes</SelectItem>
                  <SelectItem value="question_bank">Question Bank</SelectItem>
                  <SelectItem value="model_paper">Model Paper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              Submit for Approval
            </Button>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            Material will be reviewed by Admin before going live
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
