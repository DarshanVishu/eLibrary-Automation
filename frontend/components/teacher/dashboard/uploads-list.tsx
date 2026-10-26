'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface Upload {
  id: number | string;
  bookId?: string | null;
  title: string;
  grade: number | string;
  subject: string;
  pages: number;
  status: string;
  views: number;
  uploadedAt: string;
}

interface UploadsListProps {
  myUploads: Upload[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-success/15 text-success';
    case 'pending':
      return 'bg-warning/15 text-warning';
    case 'rejected':
      return 'bg-destructive/15 text-destructive';
    default:
      return '';
  }
};

export function UploadsList({ myUploads }: UploadsListProps) {
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');

  const filteredAndSortedUploads = myUploads
    .filter((upload) => {
      const gradeMatch = filterGrade === 'all' || upload.grade.toString() === filterGrade;
      const statusMatch = filterStatus === 'all' || upload.status === filterStatus;
      return gradeMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'latest')
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      return 0;
    });

  return (
    <Card className="border-border shadow-sm lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-foreground text-sm font-bold">My Uploads</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                <SelectItem key={g} value={g.toString()}>
                  Grade {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Waiting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by Latest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Sort by Latest</SelectItem>
              <SelectItem value="views">Sort by Views</SelectItem>
            </SelectContent>
          </Select>

          {(filterGrade !== 'all' || filterStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterGrade('all');
                setFilterStatus('all');
                setSortBy('latest');
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Results Count */}
        {(filterGrade !== 'all' || filterStatus !== 'all') && (
          <p className="text-muted-foreground mb-3 text-sm">
            Showing {filteredAndSortedUploads.length} of {myUploads.length} uploads
          </p>
        )}

        {/* Uploads List */}
        <div className="space-y-2">
          {filteredAndSortedUploads.map((upload) => (
            <div key={upload.id} className="border-border flex items-center gap-4 border-b p-3">
              <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <Icon name="description" className="text-muted-foreground h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{upload.title}</p>
                  {upload.bookId && (
                    <Badge
                      variant="outline"
                      className="shrink-0 px-1.5 py-0 font-mono text-[10px] font-bold"
                    >
                      ID: {upload.bookId}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Grade {upload.grade} · {upload.subject} · {upload.pages} pages
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="secondary" className={getStatusColor(upload.status)}>
                  {upload.status === 'approved' ? (
                    <Icon name="check_circle" className="mr-1 h-3 w-3" />
                  ) : (
                    <Icon name="schedule" className="mr-1 h-3 w-3" />
                  )}
                  {upload.status === 'approved' ? 'Approved' : 'Waiting'}
                </Badge>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Icon name="visibility" className="mr-2 h-3 w-3" /> {upload.views}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
