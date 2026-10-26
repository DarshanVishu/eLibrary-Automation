'use client';

import { ExportReportDialog } from './reports';
import { AddUserModal } from './users/add-user-modal';
import { BulkAddModal } from './users/bulk-add-modal';
import { EditUserModal } from './users/edit-user-modal';
import { ResetPasswordModal } from './users/reset-password-modal';
import { manageUserStatus, deleteAdminUser } from '@/app/admin/users/actions';
import type { UsersStats, UsersPageData, User } from '@/app/admin/users/actions';
import { FilterBar } from '@/components/shared/filter-bar';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { RefreshButton } from '@/components/shared/refresh-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { roleBadgeColors } from '@/lib/theme/theme';
import type { AppRole } from '@/lib/types/database';
import { useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

const roleIconName = {
  student: 'student',
  teacher: 'book',
  admin: 'shield',
} as const;

function pb(c: string) {
  return c;
}

interface AdminUsersProps {
  stats: UsersStats;
  pageData: UsersPageData;
  page: number;
  filterRole: AppRole | 'all';
  filterStatus: 'active' | 'inactive' | 'all';
  filterGrade?: string;
  search: string;
  onPageChange: (p: number) => void;
  onFilterRoleChange: (r: AppRole | 'all') => void;
  onFilterStatusChange: (s: 'active' | 'inactive' | 'all') => void;
  onFilterGradeChange?: (g: string) => void;
  onSearchChange: (q: string) => void;
  onRefresh?: () => Promise<void>;
}

export function AdminUsers({
  stats,
  pageData,
  page,
  filterRole,
  filterStatus,
  filterGrade = 'all',
  search,
  onPageChange,
  onFilterRoleChange,
  onFilterStatusChange,
  onFilterGradeChange,
  onSearchChange,
  onRefresh,
}: AdminUsersProps) {
  const [isPending, setIsPending] = useState(false);

  const [addUserRole, setAddUserRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState<User | null>(null);

  const totalPages = Math.ceil(pageData.total / PAGE_SIZE);

  const toggleStatus = async (id: string, currentStatus: string) => {
    setIsPending(true);
    await manageUserStatus(id, currentStatus !== 'active');
    setIsPending(false);
    if (onRefresh) await onRefresh();
  };

  const deleteUser = async (id: string) => {
    setIsPending(true);
    const result = await deleteAdminUser(id);
    setIsPending(false);
    if (result && (result as any).error) {
      toast.error((result as any).error || 'Failed to delete user');
    } else {
      toast.success('User deleted successfully');
      if (onRefresh) await onRefresh();
    }
  };

  const summaryCards = [
    { label: 'Students', count: stats.student, icon: 'student' as const },
    { label: 'Teachers', count: stats.teacher, icon: 'book' as const },
    { label: 'Admins', count: stats.admin, icon: 'shield' as const },
    { label: 'Active', count: stats.active, icon: 'person_check' as const },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-4 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground truncate text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground truncate text-sm">
            {stats.total} total registered users
          </p>
        </div>
      </div>

      {/* ─── Summary cards ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border shadow-sm">
            <CardContent className="flex items-center gap-4 pt-5 pb-5">
              <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                <Icon name={card.icon} size="lg" filled className="text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-2xl font-bold">{card.count}</p>
                <p className="text-muted-foreground truncate text-xs font-semibold">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <FilterBar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search users..."
        resultCount={pageData.total}
        resultLabel={filterRole !== 'all' ? filterRole + 's' : 'users'}
        onClearAll={() => {
          onFilterRoleChange('all');
          onFilterStatusChange('all');
          if (onFilterGradeChange) onFilterGradeChange('all');
          onSearchChange('');
        }}
        filters={[
          {
            key: 'role',
            label: 'Role',
            icon: 'people',
            type: 'toggle-group',
            value: filterRole === 'all' ? null : filterRole,
            onChange: (v) => onFilterRoleChange((v ?? 'all') as AppRole | 'all'),
            options: [
              { value: 'student', label: 'Students', icon: 'student', count: stats.student },
              { value: 'teacher', label: 'Teachers', icon: 'book', count: stats.teacher },
              { value: 'admin', label: 'Admins', icon: 'shield', count: stats.admin },
            ],
          },
          ...(filterRole === 'student'
            ? [
                {
                  key: 'grade',
                  label: 'Grade',
                  type: 'select' as const,
                  value: filterGrade === 'all' ? null : filterGrade,
                  onChange: (v: string | null) => {
                    if (onFilterGradeChange) onFilterGradeChange(v ?? 'all');
                  },
                  options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => ({
                    value: String(g),
                    label: `Grade ${g}`,
                  })),
                },
              ]
            : []),
          {
            key: 'status',
            label: 'Status',
            icon: 'person_check',
            type: 'select',
            value: filterStatus === 'all' ? null : filterStatus,
            onChange: (v) => onFilterStatusChange((v ?? 'all') as 'active' | 'inactive' | 'all'),
            options: [
              { value: 'active', label: `Active (${stats.active})` },
              { value: 'inactive', label: `Inactive (${stats.inactive})` },
            ],
          },
        ]}
        actions={
          <>
            {onRefresh && <RefreshButton onRefresh={onRefresh} />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 font-semibold">
                  <Icon name="person_add" size="sm" filled />
                  Add User
                  <Icon name="arrow_drop_down" size="sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1">
                {(['student', 'teacher', 'admin'] as const).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    className="flex cursor-pointer items-center gap-2 py-2.5 text-sm font-medium capitalize"
                    onClick={() => {
                      setAddUserRole(role);
                      setShowAddModal(true);
                    }}
                  >
                    <Icon name={roleIconName[role]} size="sm" />
                    Add {role.charAt(0).toUpperCase() + role.slice(1)}
                  </DropdownMenuItem>
                ))}
                <div className="bg-border my-1 h-px" />
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 py-2.5 text-sm font-medium"
                  onClick={() => setShowBulkAddModal(true)}
                >
                  <Icon name="group_add" size="sm" />
                  Bulk Create (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* ─── Users table ─── */}
      <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-border bg-muted/40 border-b">
              {['Name', 'Role', 'Grade / Subject', 'Email', 'Status', 'Last Active', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="text-muted-foreground px-5 py-3.5 text-xs font-bold tracking-wide uppercase"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pageData.users.map((user) => {
              const rc =
                roleBadgeColors[user.role as 'student' | 'teacher' | 'admin'] ??
                roleBadgeColors.student;
              const roleIcon = roleIconName[user.role as keyof typeof roleIconName] ?? 'shield';
              return (
                <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm"
                        style={{ background: pb(rc.primary) }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-foreground text-sm font-bold">{user.name}</div>
                        {(user as any).section && (
                          <div className="text-muted-foreground text-xs">
                            Section {(user as any).section}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-muted text-foreground border-border flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold capitalize">
                      <Icon name={roleIcon as any} size="xs" filled />
                      {user.role}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-sm font-medium">
                    {(user as any).grade
                      ? `Grade ${(user as any).grade}`
                      : (user as any).subject || '—'}
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-sm font-medium">
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`border-border flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${user.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-primary' : 'bg-muted-foreground/50'}`}
                      />
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-xs font-medium">
                    {user.lastActive}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                          <Icon name="more_vert" size="md" className="text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 p-1">
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2 py-2.5 text-sm font-medium"
                          onClick={() => setEditingUser(user)}
                        >
                          <Icon name="edit" size="sm" className="text-muted-foreground" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2 py-2.5 text-sm font-medium"
                          onClick={() => setResetPasswordUser(user)}
                        >
                          <Icon name="lock_reset" size="sm" className="text-muted-foreground" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isPending}
                          className={`flex cursor-pointer items-center gap-2 py-2.5 text-sm font-medium ${user.status === 'active' ? 'text-warning/90 focus:text-warning' : 'text-success/90 focus:text-success'}`}
                          onClick={() => toggleStatus(user.id, user.status)}
                        >
                          <Icon
                            name={user.status === 'active' ? 'person_off' : 'person_check'}
                            size="sm"
                            filled
                          />
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        {user.role === 'student' && (
                          <ExportReportDialog
                            reportType="individual"
                            studentId={user.id}
                            studentName={user.name}
                            trigger={
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center gap-2 py-2.5 text-sm font-medium"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Icon name="download" size="sm" className="text-muted-foreground" />
                                Export Report
                              </DropdownMenuItem>
                            }
                          />
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive/80 flex cursor-pointer items-center gap-2 py-2.5 text-sm font-medium"
                          onClick={() => setDeleteUserDialog(user)}
                        >
                          <Icon name="delete" size="sm" filled />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pageData.users.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-20">
            <Icon name="people" size="2xl" className="mb-4 opacity-20" />
            <p className="text-muted-foreground text-sm font-bold">No users found</p>
          </div>
        )}

        {/* ─── Pagination footer ─── */}
        {totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            label={`Showing ${page * PAGE_SIZE + 1}\u2013${Math.min((page + 1) * PAGE_SIZE, pageData.total)} of ${pageData.total} ${filterRole !== 'all' ? filterRole + 's' : 'users'}`}
          />
        )}
      </div>

      {/* ─── Modals ─── */}
      {showAddModal && (
        <AddUserModal initialRole={addUserRole} onClose={() => setShowAddModal(false)} />
      )}
      {showBulkAddModal && <BulkAddModal onClose={() => setShowBulkAddModal(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      {resetPasswordUser && (
        <ResetPasswordModal user={resetPasswordUser} onClose={() => setResetPasswordUser(null)} />
      )}
      {deleteUserDialog && (
        <Dialog open onOpenChange={(open) => !open && !isPending && setDeleteUserDialog(null)}>
          <DialogContent className="border-border bg-card max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground text-base font-bold">Delete user</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Are you sure you want to delete &quot;{deleteUserDialog.name}&quot;?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" disabled={isPending} className="font-semibold">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={isPending}
                className="font-semibold"
                onClick={async () => {
                  const user = deleteUserDialog;
                  setDeleteUserDialog(null);
                  await deleteUser(user.id);
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
