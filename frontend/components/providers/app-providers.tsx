'use client';

import { AuthProvider } from '@/components/providers/auth-provider';
import { UploadProvider } from '@/components/providers/upload-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UploadProvider>{children}</UploadProvider>
    </AuthProvider>
  );
}
