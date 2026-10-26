'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { getUploadAccessToken, saveUploadMetadata } from '@/lib/actions/upload';
import { useAuth } from '@/lib/context/auth-context';
import { UploadContext, type UploadTask } from '@/lib/context/upload-context';
import { extractPdfPageCount, isPdfFile } from '@/lib/pdf-utils';
import { createClient } from '@/lib/supabase/client';
import { uuidv4 } from '@/lib/uuid';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import * as tus from 'tus-js-client';

export { useUploads, useAutoRefreshOnUpload } from '@/lib/context/upload-context';

/** Read access token directly from localStorage as a lock-free fallback. */
function getStoredAccessToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
        const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
        if (raw) {
          const parsed = JSON.parse(raw) as { access_token?: string; expires_at?: number };
          if (
            parsed.access_token &&
            (!parsed.expires_at || parsed.expires_at * 1000 >= Date.now())
          ) {
            return parsed.access_token;
          }
        }
      } catch {
        // ignore
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.endsWith('-auth-token'))) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as { access_token?: string; expires_at?: number };
          if (
            parsed.access_token &&
            (!parsed.expires_at || parsed.expires_at * 1000 >= Date.now())
          ) {
            return parsed.access_token;
          }
        } catch {
          // ignore non-JSON
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function preflightSupabase(url: string): Promise<void> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 6000);
  try {
    await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(t);
  }
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const { session: authSession } = useAuth();
  const supabase = createClient();
  const canceledIds = React.useRef<Set<string>>(new Set());
  const processingIds = React.useRef<Set<string>>(new Set());
  /** Callbacks registered by pages that want to refresh when an upload completes. */
  const onCompleteListeners = React.useRef<Set<() => void>>(new Set());

  const registerOnComplete = React.useCallback((fn: () => void) => {
    onCompleteListeners.current.add(fn);
  }, []);

  const unregisterOnComplete = React.useCallback((fn: () => void) => {
    onCompleteListeners.current.delete(fn);
  }, []);

  // Clear uploads on sign-out.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event !== 'SIGNED_OUT') return;
      canceledIds.current = new Set();
      processingIds.current = new Set();
      setUploads([]);
      setIsMinimized(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const addUpload = (taskConfig: Omit<UploadTask, 'id' | 'progress' | 'status' | 'timestamp'>) => {
    const newTask: UploadTask = {
      ...taskConfig,
      id: uuidv4(),
      progress: 0,
      status: 'pending',
      timestamp: Date.now(),
    };
    setUploads((prev) => [...prev, newTask]);
    setIsMinimized(false);
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const dismissCompleted = () => {
    setUploads((prev) =>
      prev.filter(
        (u) => u.status !== 'completed' && u.status !== 'error' && u.status !== 'canceled',
      ),
    );
  };

  const cancelUpload = (id: string) => {
    canceledIds.current.add(id);
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'canceled', error: undefined } : u)),
    );
  };

  useEffect(() => {
    const pendingUploads = uploads.filter(
      (u) =>
        u.status === 'pending' &&
        !processingIds.current.has(u.id) &&
        !canceledIds.current.has(u.id),
    );

    pendingUploads.forEach(async (pendingTask) => {
      processingIds.current.add(pendingTask.id);
      setUploads((prev) =>
        prev.map((u) => (u.id === pendingTask.id ? { ...u, status: 'uploading' } : u)),
      );

      let prog = 0;
      let interval: NodeJS.Timeout | undefined;
      let storagePath = '';

      try {
        let accessToken = authSession?.access_token ?? getStoredAccessToken();

        if (!accessToken) {
          try {
            const { data } = await supabase.auth.getSession();
            accessToken = data.session?.access_token ?? null;
          } catch {
            accessToken = null;
          }
        }

        if (!accessToken) {
          try {
            accessToken = await getUploadAccessToken();
          } catch {
            accessToken = null;
          }
        }

        if (!accessToken) throw new Error('You must be logged in to upload.');

        const resourceId = uuidv4();
        const base = pendingTask.title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 120);
        storagePath = `${resourceId}/${base || 'document'}.pdf`;

        const apiKey =
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          '';

        try {
          await new Promise<void>((resolve, reject) => {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!supabaseUrl) return reject(new Error('Missing NEXT_PUBLIC_SUPABASE_URL'));

            // Fail fast if Supabase is unreachable.
            preflightSupabase(supabaseUrl).catch(() =>
              reject(new Error(`Cannot reach Supabase at ${supabaseUrl}.`)),
            );

            let sawProgress = false;
            const upload = new tus.Upload(pendingTask.file, {
              endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
              retryDelays: [0, 3000, 5000, 10000, 20000],
              headers: {
                authorization: `Bearer ${accessToken}`,
                apikey: apiKey,
                'x-upsert': 'true',
              },
              uploadDataDuringCreation: true,
              removeFingerprintOnSuccess: true,
              metadata: {
                bucketName: 'library-files',
                objectName: storagePath,
                contentType: pendingTask.file.type,
                cacheControl: '3600',
              },
              chunkSize: 2 * 1024 * 1024,
              onError: (error) => {
                clearInterval(interval);
                reject(error);
              },
              onProgress: (bytesUploaded, bytesTotal) => {
                sawProgress = true;
                const pct = (bytesUploaded / (bytesTotal || pendingTask.file.size || 1)) * 85;
                prog = Math.max(prog, pct);
                setUploads((prev) =>
                  prev.map((u) =>
                    u.id === pendingTask.id && u.status === 'uploading'
                      ? { ...u, progress: Math.min(Math.round(prog), 85) }
                      : u,
                  ),
                );
              },
              onSuccess: () => {
                clearInterval(interval);
                resolve();
              },
            });

            // Keep UI moving on mobile when onProgress is slow to fire.
            const uiKick = window.setInterval(() => {
              if (sawProgress) {
                window.clearInterval(uiKick);
                return;
              }
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === pendingTask.id && u.status === 'uploading'
                    ? { ...u, progress: Math.min(Math.max(u.progress, 1), 5) }
                    : u,
                ),
              );
            }, 500);

            interval = setInterval(() => {
              if (canceledIds.current.has(pendingTask.id)) {
                clearInterval(interval);
                window.clearInterval(uiKick);
                upload.abort();
                reject(new Error('Upload canceled'));
              }
            }, 500);

            upload.start();
          });
        } catch (tusErr) {
          if (canceledIds.current.has(pendingTask.id)) throw tusErr;

          // Direct Supabase storage upload fallback if TUS resumable endpoint fails or is disabled
          const { error: directUploadErr } = await supabase.storage
            .from('library-files')
            .upload(storagePath, pendingTask.file, {
              contentType: pendingTask.file.type,
              cacheControl: '3600',
              upsert: true,
            });

          if (directUploadErr) {
            throw directUploadErr;
          }
        }

        // Slow progress animation while server action runs (85 → 97%).
        prog = Math.max(prog, 85);
        interval = setInterval(() => {
          prog = prog + (97 - prog) * 0.15;
          setUploads((prev) =>
            prev.map((u) =>
              u.id === pendingTask.id && u.status === 'uploading'
                ? { ...u, progress: Math.min(Math.round(prog), 97) }
                : u,
            ),
          );
        }, 1000);

        const pageCount = isPdfFile(pendingTask.file)
          ? await extractPdfPageCount(pendingTask.file)
          : 0;

        // All DB writes run server-side — no browser auth lock involved.
        const metaResult = await saveUploadMetadata({
          resourceId,
          bookId: pendingTask.bookId,
          title: pendingTask.title,
          subjectId: pendingTask.subjectId,
          grade: parseInt(pendingTask.grade, 10),
          type: pendingTask.type,
          storagePath,
          fileMime: pendingTask.file.type,
          fileSizeBytes: pendingTask.file.size,
          pageCount,
        });
        if (!metaResult.success) throw new Error(metaResult.error);

        clearInterval(interval);
        processingIds.current.delete(pendingTask.id);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === pendingTask.id ? { ...u, status: 'completed', progress: 100 } : u,
          ),
        );
        // Notify all pages that have registered a refresh callback.
        onCompleteListeners.current.forEach((fn) => fn());
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== pendingTask.id));
        }, 2000);
      } catch (err: unknown) {
        clearInterval(interval);
        processingIds.current.delete(pendingTask.id);

        const isCanceled =
          canceledIds.current.has(pendingTask.id) ||
          (err instanceof Error && err.message === 'Upload canceled');

        if (isCanceled) {
          if (storagePath) await supabase.storage.from('library-files').remove([storagePath]);
          setUploads((prev) =>
            prev.map((u) => (u.id === pendingTask.id ? { ...u, status: 'canceled' } : u)),
          );
        } else {
          toast.error(err instanceof Error ? err.message : 'Upload failed');
          setUploads((prev) =>
            prev.map((u) =>
              u.id === pendingTask.id
                ? {
                    ...u,
                    status: 'error',
                    error: err instanceof Error ? err.message : 'Upload failed',
                  }
                : u,
            ),
          );
        }
      }
    });
  }, [uploads, supabase, authSession]);

  // Prevent accidental tab close during active uploads.
  const activeUploadsCount = uploads.filter(
    (u) => u.status === 'uploading' || u.status === 'pending',
  ).length;
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeUploadsCount > 0) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeUploadsCount]);

  const canceledCount = uploads.filter((u) => u.status === 'canceled').length;
  const errorCount = uploads.filter((u) => u.status === 'error').length;
  const completedCount = uploads.filter((u) => u.status === 'completed').length;
  const hasUploads = uploads.length > 0;

  return (
    <UploadContext.Provider
      value={{
        uploads,
        addUpload,
        removeUpload,
        dismissCompleted,
        cancelUpload,
        registerOnComplete,
        unregisterOnComplete,
      }}
    >
      {children}

      {hasUploads && (
        <div className="border-border bg-card fixed right-6 bottom-6 z-50 flex w-80 flex-col overflow-hidden rounded-lg border shadow-xl transition-all duration-300">
          <div
            className="bg-muted/80 flex cursor-pointer items-center justify-between px-4 py-3"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2">
              {activeUploadsCount > 0 ? (
                <Icon name="upload" size="sm" className="text-primary font-bold" />
              ) : errorCount > 0 ? (
                <Icon name="error" size="sm" filled className="text-destructive" />
              ) : canceledCount > 0 && completedCount === 0 ? (
                <Icon name="cancel" size="sm" filled className="text-muted-foreground" />
              ) : (
                <Icon name="check_circle" size="sm" filled className="text-emerald-500" />
              )}
              <span className="text-foreground text-sm font-bold">
                {activeUploadsCount > 0
                  ? `Uploading ${activeUploadsCount} item${activeUploadsCount > 1 ? 's' : ''}...`
                  : errorCount > 0
                    ? `Upload failed`
                    : canceledCount > 0 && completedCount === 0
                      ? `Upload canceled`
                      : `Uploads complete`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              type="button"
              aria-label={isMinimized ? 'Expand uploads' : 'Collapse uploads'}
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized((p) => !p);
              }}
            >
              <Icon name={isMinimized ? 'arrow_drop_up' : 'arrow_drop_down'} size="xs" />
            </Button>
          </div>

          <div
            className={`flex flex-col overflow-y-auto transition-all duration-300 ${isMinimized ? 'h-0' : 'max-h-64'}`}
          >
            <div className="divide-border/60 divide-y">
              {uploads.map((upload) => (
                <div key={upload.id} className="p-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p
                      className="text-foreground truncate pr-2 text-xs font-semibold"
                      title={upload.title}
                    >
                      {upload.title}
                    </p>
                    {(upload.status === 'pending' || upload.status === 'uploading') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        type="button"
                        aria-label="Cancel upload"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelUpload(upload.id);
                        }}
                      >
                        <Icon name="close" size="xs" />
                      </Button>
                    )}
                    {upload.status === 'completed' && (
                      <Icon
                        name="check_circle"
                        size="sm"
                        filled
                        className="text-success shrink-0"
                      />
                    )}
                    {upload.status === 'error' && (
                      <Icon name="error" size="sm" filled className="text-destructive shrink-0" />
                    )}
                    {upload.status === 'canceled' && (
                      <Icon
                        name="cancel"
                        size="sm"
                        filled
                        className="text-muted-foreground shrink-0"
                      />
                    )}
                  </div>

                  {upload.status === 'uploading' && (
                    <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {upload.status === 'error' && (
                    <p className="text-destructive mt-1 line-clamp-2 text-[10px] font-medium">
                      {upload.error}
                    </p>
                  )}
                  {upload.status === 'canceled' && (
                    <p className="text-muted-foreground mt-1 text-[10px] font-medium">
                      Upload canceled
                    </p>
                  )}
                </div>
              ))}
            </div>
            {uploads.some((u) => u.status === 'completed' || u.status === 'error') && (
              <div className="bg-muted/30 p-2">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground h-8 w-full text-xs font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissCompleted();
                  }}
                >
                  Clear completed
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </UploadContext.Provider>
  );
}
