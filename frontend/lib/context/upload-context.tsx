'use client';

import React, { createContext, useContext } from 'react';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error' | 'canceled';

export interface UploadTask {
  id: string;
  bookId?: string;
  file: File;
  title: string;
  subjectId: string;
  grade: string;
  type: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  timestamp: number;
}

export interface UploadContextType {
  uploads: UploadTask[];
  addUpload: (task: Omit<UploadTask, 'id' | 'progress' | 'status' | 'timestamp'>) => void;
  removeUpload: (id: string) => void;
  dismissCompleted: () => void;
  cancelUpload: (id: string) => void;
  /** Register a callback to be invoked whenever any upload completes successfully. */
  registerOnComplete: (fn: () => void) => void;
  /** Unregister a previously registered completion callback. */
  unregisterOnComplete: (fn: () => void) => void;
}

export const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function useUploads(): UploadContextType {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploads must be used within an UploadProvider');
  return ctx;
}

/**
 * Registers `onRefresh` with the UploadProvider so it is called automatically
 * whenever any upload completes successfully. Cleans up on unmount.
 *
 * Usage:
 *   useAutoRefreshOnUpload(fetchData);
 */
export function useAutoRefreshOnUpload(onRefresh: () => void): void {
  const { registerOnComplete, unregisterOnComplete } = useUploads();
  // Keep a stable ref so the identity never changes even if the caller
  // re-creates the callback on each render. Updated in useLayoutEffect
  // (not during render) to satisfy react-hooks/refs.
  const stableRef = React.useRef(onRefresh);
  React.useLayoutEffect(() => {
    stableRef.current = onRefresh;
  });

  React.useEffect(() => {
    const fn = () => stableRef.current();
    registerOnComplete(fn);
    return () => unregisterOnComplete(fn);
  }, [registerOnComplete, unregisterOnComplete]);
}
