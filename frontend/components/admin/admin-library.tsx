'use client';

import { adminUpdateMaterialMetadata, deleteResource } from '@/app/admin/library/actions';
import type { LibraryStats, LibraryPageData } from '@/app/admin/library/actions';
import { EditMaterialSheet } from '@/components/shared/edit-material-sheet';
import type { EditMaterialInitialValues } from '@/components/shared/edit-material-sheet';
import { FilterBar } from '@/components/shared/filter-bar';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { PreviewDialog } from '@/components/shared/preview-dialog';
import { RefreshButton } from '@/components/shared/refresh-button';
import { UploadSheet } from '@/components/shared/upload-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CHART_COLORS } from '@/lib/constants';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

const chartVars = {
  grid: 'var(--border)',
  axisText: 'var(--muted-foreground)',
  tooltipBg: 'var(--popover)',
  tooltipBorder: '1px solid var(--border)',
  tooltipCursor: 'var(--muted)',
};

export function AdminLibrary({
  stats,
  pageData,
  page,
  search,
  filterSubject,
  filterType,
  filterGrade,
  onPageChange,
  onSearchChange,
  onFilterSubjectChange,
  onFilterTypeChange,
  onFilterGradeChange,
  onClearAll,
  onRefresh,
}: {
  stats: LibraryStats;
  pageData: LibraryPageData;
  page: number;
  search: string;
  filterSubject: string;
  filterType: string;
  filterGrade: string;
  onPageChange: (p: number) => void;
  onSearchChange: (v: string) => void;
  onFilterSubjectChange: (v: string) => void;
  onFilterTypeChange: (v: string) => void;
  onFilterGradeChange: (v: string) => void;
  onClearAll: () => void;
  onRefresh?: () => Promise<void>;
}) {
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [showChart, setShowChart] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{ id: string; title: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; title: string } | null>(null);
  const [editDialog, setEditDialog] = useState<EditMaterialInitialValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openPreview = (bookId: string, title: string) => {
    setPreviewDialog({ id: bookId, title });
  };

  const closePreview = () => {
    setPreviewDialog(null);
  };

  // optimistic delete
  const books = pageData.books.filter((b) => !deletedIds.includes(b.id));
  const totalPages = Math.ceil(pageData.total / 24);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-4 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground truncate text-2xl font-bold">Content Library</h2>
          <p className="text-muted-foreground truncate text-sm">
            {stats.total - deletedIds.length} resources across all grades and subjects
          </p>
        </div>
        {onRefresh && <RefreshButton onRefresh={onRefresh} />}
        <Button
          variant="secondary"
          onClick={() => setShowChart((s) => !s)}
          className="gap-2 font-semibold"
        >
          <Icon name="bar_chart" size="sm" />
          {showChart ? 'Hide Chart' : 'Show Chart'}
        </Button>
        <Button onClick={() => setIsUploadOpen(true)} className="gap-2 font-semibold">
          <Icon name="add" size="sm" filled />
          Add Resource
        </Button>
      </div>

      <UploadSheet open={isUploadOpen} onOpenChange={setIsUploadOpen} />

      {/* ─── Subject distribution chart ─── */}
      {showChart && (
        <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-foreground text-lg font-bold">Content by Subject</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={stats.contentBySubject}
              barSize={32}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartVars.grid} vertical={false} />
              <XAxis
                dataKey="subject"
                tick={{ fontSize: 12, fill: chartVars.axisText }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 12, fill: chartVars.axisText }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: chartVars.tooltipCursor }}
                contentStyle={{
                  background: chartVars.tooltipBg,
                  border: chartVars.tooltipBorder,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{ color: 'var(--popover-foreground)' }}
                itemStyle={{ color: 'var(--popover-foreground)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.contentBySubject.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── Filters ─── */}
      <FilterBar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search resources..."
        resultCount={pageData.total}
        resultLabel={pageData.total === 1 ? 'resource' : 'resources'}
        onClearAll={onClearAll}
        filters={[
          {
            key: 'subject',
            label: 'Subject',
            type: 'select',
            value: filterSubject === 'all' ? null : filterSubject,
            onChange: (v) => onFilterSubjectChange(v ?? 'all'),
            options: stats.subjects.map((s) => ({ value: s, label: s })),
          },
          {
            key: 'type',
            label: 'Type',
            type: 'select',
            value: filterType === 'all' ? null : filterType,
            onChange: (v) => onFilterTypeChange(v ?? 'all'),
            options: stats.materialTypes.map((t) => ({ value: t, label: t })),
          },
          {
            key: 'grade',
            label: 'Grade',
            type: 'select',
            value: filterGrade === 'all' ? null : filterGrade,
            onChange: (v) => onFilterGradeChange(v ?? 'all'),
            options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => ({
              value: String(g),
              label: `Grade ${g}`,
            })),
          },
        ]}
      />

      {/* ─── Table ─── */}
      <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-border bg-muted/40 border-b">
              {[
                'Resource',
                'Subject',
                'Grade',
                'Type',
                'Views',
                'Pages / Size',
                'Uploaded By',
                '',
              ].map((h) => (
                <th
                  key={h}
                  className="text-muted-foreground px-5 py-3.5 text-xs font-bold tracking-wide uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {books.map((book) => {
              return (
                <tr key={book.id} className="hover:bg-muted/40 transition-colors">
                  <td className="w-64 max-w-64 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg shadow-sm">
                        <Icon
                          name={book.icon as IconName}
                          size="md"
                          filled
                          className="text-muted-foreground"
                        />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-foreground block max-w-40 truncate text-sm font-bold">
                              {book.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{book.title}</TooltipContent>
                        </Tooltip>
                        {book.bookId && (
                          <span className="text-muted-foreground font-mono text-xs">
                            ID: {book.bookId}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-sm font-medium">
                    {book.subject}
                  </td>
                  <td className="px-5 py-4">
                    {book.grades.length >= 10 ? (
                      <Badge className="px-2.5 py-1 text-xs font-bold">All Grades</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {book.grades.map((g) => (
                          <Badge key={g} className="px-2.5 py-1 text-xs font-bold">
                            Grade {g}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary" className="text-[11px] font-bold">
                      {book.type}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-600">
                    {book.views.toLocaleString()}
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-xs font-medium">
                    {book.pages} pp · {book.fileSize}
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-xs font-medium">
                    {book.uploadedBy}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                        aria-label={`Edit ${book.title}`}
                        onClick={() =>
                          setEditDialog({
                            id: book.id,
                            bookId: book.bookId,
                            title: book.title,
                            subject: book.subject,
                            grades: book.grades,
                            type: book.rawType,
                          })
                        }
                      >
                        <Icon name="edit" size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                        onClick={() => openPreview(book.id, book.title)}
                      >
                        <Icon name="eye" size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                        onClick={() => setDeleteDialog({ id: book.id, title: book.title })}
                      >
                        <Icon name="delete" size="sm" filled />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {books.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-20">
            <Icon name="books" size="2xl" className="mb-4 opacity-20" />
            <p className="text-muted-foreground text-sm font-bold">
              No resources match your filters
            </p>
            <p className="mt-1 text-xs">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            label={`Showing ${page * 24 + 1}\u2013${Math.min((page + 1) * 24, pageData.total)} of ${pageData.total} resources`}
          />
        )}
      </div>

      {/* Preview Dialog */}
      {previewDialog && (
        <PreviewDialog
          isOpen={!!previewDialog}
          onClose={closePreview}
          resourceId={previewDialog.id}
          title={previewDialog.title}
          description="Content Library document preview"
        />
      )}

      {/* Edit Material Sheet */}
      <EditMaterialSheet
        open={!!editDialog}
        onOpenChange={(open) => !open && setEditDialog(null)}
        initial={editDialog}
        onSave={async (params) => {
          const result = await adminUpdateMaterialMetadata(params);
          if (result.success && onRefresh) await onRefresh();
          return result;
        }}
      />

      {/* Delete confirmation dialog */}
      {deleteDialog && (
        <Dialog open onOpenChange={(open) => !open && !isDeleting && setDeleteDialog(null)}>
          <DialogContent className="border-border bg-card max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground text-base font-bold">
                Delete resource
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Are you sure you want to delete &quot;{deleteDialog.title}&quot; from the library?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" disabled={isDeleting} className="font-semibold">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={isDeleting}
                className="font-semibold"
                onClick={async () => {
                  if (!deleteDialog) return;
                  setIsDeleting(true);
                  setDeletedIds((d) => [...d, deleteDialog.id]);
                  const result = await deleteResource(deleteDialog.id);
                  setIsDeleting(false);
                  setDeleteDialog(null);
                  if (result && 'error' in result) {
                    toast.error(result.error || 'Failed to delete resource');
                  } else {
                    toast.success('Resource deleted successfully');
                    if (onRefresh) await onRefresh();
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
