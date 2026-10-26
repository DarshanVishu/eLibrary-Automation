'use client';

import {
  getTeacherPreviewUrl,
  getTeacherUploadsData,
  updateMaterialMetadata,
} from '@/app/teacher/uploads/actions';
import { useAutoRefreshOnUpload } from '@/components/providers/upload-provider';
import { EditMaterialSheet } from '@/components/shared/edit-material-sheet';
import type { EditMaterialInitialValues } from '@/components/shared/edit-material-sheet';
import { FilterBar } from '@/components/shared/filter-bar';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { PreviewDialog } from '@/components/shared/preview-dialog';
import { RefreshButton } from '@/components/shared/refresh-button';
import { UploadSheet } from '@/components/shared/upload-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useCallback, useEffect, useState } from 'react';

interface Material {
  id: string;
  bookId?: string | null;
  title: string;
  /** Raw material_type key e.g. "textbook" */
  rawType: string;
  /** Formatted label e.g. "NCERT Textbook" */
  type: string;
  grades: number[];
  subject: string;
  uploadDate: string;
  status: 'approved' | 'pending';
  views: number;
  size: string;
}

const getStatusColor = (status: Material['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-success/15 text-success';
    case 'pending':
      return 'bg-warning/15 text-warning';
    default:
      return '';
  }
};

export function TeacherUploads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [previewDialog, setPreviewDialog] = useState<{ id: string; title: string } | null>(null);
  const [editDialog, setEditDialog] = useState<EditMaterialInitialValues | null>(null);
  const [page, setPage] = useState(0);
  const filterKey = `${searchTerm}-${selectedGrade}-${selectedStatus}-${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }

  const fetchData = useCallback(async () => {
    const data = await getTeacherUploadsData();
    setMaterials(
      data.books.map((b) => ({
        id: b.id,
        bookId: b.bookId,
        title: b.title,
        rawType: b.rawType,
        type: b.type,
        grades: b.grades,
        subject: b.subject,
        uploadDate: b.createdAt,
        status: b.published ? 'approved' : 'pending',
        views: b.views,
        size: b.fileSize,
      })),
    );
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  // Auto-refresh when any upload completes from the floating upload widget.
  useAutoRefreshOnUpload(fetchData);

  const filteredMaterials = materials
    .filter(
      (material) =>
        (material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (material.bookId || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedGrade === 'all' || material.grades.map(String).includes(selectedGrade)) &&
        (selectedStatus === 'all' || material.status === selectedStatus),
    )
    .sort((a, b) => {
      if (sortBy === 'latest')
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      if (sortBy === 'views') return b.views - a.views;
      return a.title.localeCompare(b.title);
    });

  const totalPages = Math.ceil(filteredMaterials.length / 24);
  const pagedMaterials = filteredMaterials.slice(page * 24, (page + 1) * 24);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h2 className="text-foreground text-2xl font-bold">My Uploads</h2>
        <p className="text-muted-foreground text-sm">Manage and track your uploaded materials</p>
      </div>

      <UploadSheet open={isUploadOpen} onOpenChange={setIsUploadOpen} />

      <FilterBar
        search={searchTerm}
        onSearchChange={(v) => setSearchTerm(v)}
        searchPlaceholder="Search materials..."
        resultCount={filteredMaterials.length}
        resultLabel={filteredMaterials.length === 1 ? 'material' : 'materials'}
        onClearAll={() => {
          setSearchTerm('');
          setSelectedGrade('all');
          setSelectedStatus('all');
          setSortBy('latest');
        }}
        filters={[
          {
            key: 'grade',
            label: 'Grade',
            type: 'select',
            value: selectedGrade === 'all' ? null : selectedGrade,
            onChange: (v) => setSelectedGrade(v ?? 'all'),
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => ({
              value: String(g),
              label: `Grade ${g}`,
            })),
          },
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: selectedStatus === 'all' ? null : selectedStatus,
            onChange: (v) => setSelectedStatus(v ?? 'all'),
            options: [
              { value: 'approved', label: 'Approved' },
              { value: 'pending', label: 'Waiting' },
            ],
          },
          {
            key: 'sort',
            label: 'Sort by',
            type: 'select',
            value: sortBy === 'latest' ? null : sortBy,
            onChange: (v) => setSortBy(v ?? 'latest'),
            options: [
              { value: 'latest', label: 'Latest' },
              { value: 'views', label: 'Most Views' },
              { value: 'name', label: 'Name' },
            ],
          },
        ]}
        actions={
          <>
            <RefreshButton onRefresh={fetchData} />
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2 font-semibold">
              <Icon name="upload" size="sm" />
              Upload New
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        {pagedMaterials.map((material) => (
          <div
            key={material.id}
            className="border-border bg-card flex items-center gap-4 rounded-lg border p-4 shadow-sm"
          >
            <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <Icon name="description" className="text-muted-foreground h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{material.title}</p>
                {material.bookId && (
                  <Badge
                    variant="outline"
                    className="shrink-0 px-1.5 py-0 font-mono text-[10px] font-bold"
                  >
                    ID: {material.bookId}
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                {(material.grades ?? []).length >= 10 ? (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                    All Grades
                  </Badge>
                ) : (
                  (material.grades ?? []).map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] font-bold"
                    >
                      Grade {g}
                    </Badge>
                  ))
                )}
                <span>
                  · {material.subject} · {material.size}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Badge variant="secondary" className={getStatusColor(material.status)}>
                {material.status === 'approved' ? (
                  <Icon name="check_circle" className="mr-1 h-3 w-3" />
                ) : (
                  <Icon name="schedule" className="mr-1 h-3 w-3" />
                )}
                {material.status === 'approved' ? 'Approved' : 'Waiting'}
              </Badge>
              <span className="text-muted-foreground text-xs">{material.views} views</span>
              {/* Edit button — available before & after admin approval */}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${material.title}`}
                onClick={() =>
                  setEditDialog({
                    id: material.id,
                    bookId: material.bookId,
                    title: material.title,
                    subject: material.subject,
                    grades: material.grades,
                    type: material.rawType,
                  })
                }
              >
                <Icon name="edit" className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Preview ${material.title}`}
                onClick={() => setPreviewDialog({ id: material.id, title: material.title })}
              >
                <Icon name="visibility" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            label={`Showing ${page * 24 + 1}\u2013${Math.min((page + 1) * 24, filteredMaterials.length)} of ${filteredMaterials.length} materials`}
          />
        )}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-muted-foreground">
            <Icon name="upload" className="mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">No materials found</h3>
            <p className="text-sm">Try adjusting your filters or upload new materials.</p>
          </div>
        </div>
      )}

      <PreviewDialog
        isOpen={!!previewDialog}
        onClose={() => setPreviewDialog(null)}
        resourceId={previewDialog?.id ?? ''}
        title={previewDialog?.title ?? ''}
        fetchUrl={getTeacherPreviewUrl}
      />

      <EditMaterialSheet
        open={!!editDialog}
        onOpenChange={(open) => !open && setEditDialog(null)}
        initial={editDialog}
        onSave={async (params) => {
          const result = await updateMaterialMetadata(params);
          if (result.success) await fetchData();
          return result;
        }}
      />
    </div>
  );
}
