'use client';
import { AdminLayout } from '@/components/layouts/admin-layout';

export const dynamic = 'force-dynamic';


export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
