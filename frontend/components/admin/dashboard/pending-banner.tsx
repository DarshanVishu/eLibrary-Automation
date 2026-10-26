'use client';

import { UploadSheet } from '@/components/shared/upload-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminPendingBanner({ count }: { count: number }) {
  const router = useRouter();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 py-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Icon name="pending" size="md" filled className="text-warning" />
            <p className="text-foreground text-sm font-bold">
              <span className="text-warning">{count} submissions</span> awaiting your review
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-lg font-bold"
              onClick={() => router.push('/admin/approvals')}
            >
              Review Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg font-semibold"
              onClick={() => setIsUploadOpen(true)}
            >
              Upload Content
            </Button>
          </div>
        </CardContent>
      </Card>
      <UploadSheet open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
}
