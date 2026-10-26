'use client';

import { approveResource, rejectResource, clearAllApprovals } from '@/app/admin/approvals/actions';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { PreviewDialog } from '@/components/shared/preview-dialog';
import { RefreshButton } from '@/components/shared/refresh-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icon, type IconName } from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const typeIcons: Record<string, IconName> = {
  'Study Notes': 'description',
  'Question Bank': 'help_circle',
  'Model Paper': 'article',
  'NCERT Textbook': 'book',
};

export function AdminApprovals({
  initialApprovals,
  initialActioned,
  onRefresh,
}: {
  initialApprovals: any[];
  initialActioned: any[];
  onRefresh?: () => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewDialog, setPreviewDialog] = useState<{ id: string; title: string } | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const filtered = initialApprovals;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const clampedPage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = filtered.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  const handleApprove = async (id: string) => {
    try {
      setIsPending(true);
      const result = await approveResource(id);
      setIsPending(false);
      if (result.success) {
        if (!result.isOwnResource) {
          toast.success('Resource approved and published successfully');
        }
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        toast.error(result.error || 'Failed to approve resource');
      }
    } catch {
      toast.error('Failed to approve resource');
      setIsPending(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setIsPending(true);
      const result = await rejectResource(id, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      setIsPending(false);
      if (result.success) {
        if (!result.isOwnResource) {
          toast.success('Resource rejected successfully');
        }
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        toast.error(result.error || 'Failed to reject resource');
      }
    } catch {
      toast.error('Failed to reject resource');
      setRejectModal(null);
      setRejectReason('');
      setIsPending(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsPending(true);
      const result = await clearAllApprovals();
      setIsPending(false);
      if (result.success) {
        if (!result.isOwnResources) {
          toast.success(`${result.count} resources approved and published successfully`);
        }
        // Refresh data to update UI
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        toast.error(result.error || 'Failed to clear all approvals');
      }
    } catch {
      toast.error('Failed to clear all approvals');
      setIsPending(false);
    }
  };

  const openPreview = (id: string, title: string) => setPreviewDialog({ id, title });
  const closePreview = () => setPreviewDialog(null);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-foreground text-2xl font-bold">Content Approvals</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Review and approve materials uploaded by teachers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold shadow-sm ${
              initialApprovals.length > 0
                ? 'border-warning-border text-warning bg-warning-foreground border'
                : 'border-success-border text-success bg-success-foreground border'
            }`}
          >
            {initialApprovals.length > 0 ? (
              <>
                <Icon name="pending" size="xs" />
                {initialApprovals.length} Pending
              </>
            ) : (
              <>
                <Icon name="check_circle" size="xs" />
                No Pending Items
              </>
            )}
          </span>
          {initialApprovals.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={handleClearAll}
              className="text-destructive border-destructive/20 bg-destructive/10 hover:bg-destructive/20 gap-1.5 font-bold"
            >
              <Icon name="check_circle" size="xs" />
              Approve All Pending
            </Button>
          )}
          {onRefresh && <RefreshButton onRefresh={onRefresh} />}
        </div>
      </div>

      {/* Pending Approvals */}
      {initialApprovals.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((item: any) => (
              <div
                key={item.id}
                className="border-border bg-card group relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="border-border border-b p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary text-secondary-foreground flex h-10 w-10 items-center justify-center rounded-lg">
                        <Icon
                          name={typeIcons[item.type] || 'description'}
                          size="md"
                          className="text-secondary-foreground"
                        />
                      </div>
                      <div>
                        <h3 className="text-card-foreground line-clamp-2 text-sm font-semibold">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-xs font-medium">
                          by {item.teacher}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item.grade}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex-1">
                    <p className="text-muted-foreground line-clamp-3 text-xs font-medium">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                      <Icon name="description" size="xs" className="text-muted-foreground" />
                      {item.pages} pages · {item.size}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                      <Icon name="schedule" size="xs" className="text-muted-foreground" />
                      {item.submitted}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleApprove(item.id)}
                      className="gap-1.5 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                    >
                      <Icon name="check" size="xs" filled />
                      Approve & Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => setRejectModal(item.id)}
                      className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 gap-1.5 font-bold"
                    >
                      <Icon name="cancel" size="xs" filled className="text-destructive" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 font-bold"
                      onClick={() => openPreview(item.id, item.title)}
                    >
                      <Icon name="preview" size="xs" className="text-muted-foreground" />
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <PaginationBar
              page={clampedPage}
              totalPages={totalPages}
              onPageChange={setPage}
              label={`Showing ${clampedPage * PAGE_SIZE + 1}\u2013${Math.min((clampedPage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} items`}
            />
          )}
        </div>
      )}

      {/* Actioned Items */}
      {initialActioned.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">Previously Actioned</h2>
            <span className="text-muted-foreground text-xs font-medium">
              {initialActioned.length} decision{initialActioned.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-border bg-muted/40 border-b">
                  {[
                    'Resource',
                    'Grade',
                    'Status',
                    'Decision Date',
                    'Pages / Size',
                    'Teacher',
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
                {initialActioned.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="w-64 max-w-64 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                            item.status === 'approved'
                              ? 'bg-success-foreground'
                              : 'bg-destructive-foreground'
                          }`}
                        >
                          {item.status === 'approved' ? (
                            <Icon name="check_circle" size="md" filled className="text-success" />
                          ) : (
                            <Icon name="cancel" size="md" filled className="text-destructive" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-card-foreground block max-w-40 truncate text-sm font-semibold">
                                {item.title}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{item.title}</TooltipContent>
                          </Tooltip>
                          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs font-medium">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={item.grade === 'Grade 5' ? 'default' : 'secondary'}
                        className="px-2.5 py-1 text-xs font-bold"
                      >
                        {item.grade}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                          item.status === 'approved'
                            ? 'bg-success-foreground text-success'
                            : 'bg-destructive-foreground text-destructive'
                        }`}
                      >
                        {item.status === 'approved' ? (
                          <>
                            <Icon name="check" size="xs" />
                            Approved
                          </>
                        ) : (
                          <>
                            <Icon name="close" size="xs" />
                            Rejected
                          </>
                        )}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-5 py-4 text-xs font-medium">
                      {item.actionedAt}
                    </td>
                    <td className="text-muted-foreground px-5 py-4 text-xs font-medium">
                      {item.pages} pages · {item.size}
                    </td>
                    <td className="text-muted-foreground px-5 py-4 text-xs font-medium">
                      {item.teacher}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 font-bold"
                          onClick={() => openPreview(item.id, item.title)}
                        >
                          <Icon name="preview" size="xs" className="text-muted-foreground" />
                          Preview
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
          <DialogContent className="border-border bg-card flex max-w-md flex-col gap-0 p-6">
            <DialogHeader className="flex flex-col gap-4">
              <DialogTitle className="text-foreground text-base font-bold">
                Reject Material
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-muted-foreground mb-6 text-sm font-medium">
              Provide a reason — it will be shared with the teacher.
            </DialogDescription>
            <Textarea
              className="w-full resize-none text-sm font-medium"
              placeholder="E.g. Content is incomplete. Please add Chapter 5 exercises."
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <DialogFooter className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 font-bold"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleReject(rejectModal!)}
                className="bg-destructive hover:bg-destructive/90 flex-1 font-bold text-white"
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Dialog */}
      {previewDialog && (
        <PreviewDialog
          isOpen={!!previewDialog}
          onClose={closePreview}
          resourceId={previewDialog.id}
          title={previewDialog.title}
          description="Content approval document preview"
        />
      )}
    </div>
  );
}
