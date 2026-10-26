'use client';

import { editAdminUser } from '@/app/admin/users/actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface EditUserModalProps {
  user: any;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [editingUser, setEditingUser] = useState({
    ...user,
    grade: user.grade ? user.grade.toString() : '',
  });

  const handleSave = async () => {
    setIsPending(true);
    await editAdminUser(editingUser.id, {
      name: editingUser.name,
      grade:
        editingUser.role === 'student' && editingUser.grade
          ? parseInt(editingUser.grade, 10)
          : undefined,
    });
    setIsPending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="border-border bg-secondary w-full max-w-md overflow-hidden rounded-lg border shadow-xl">
        <div className="border-border/60 flex items-center justify-between border-b px-6 py-5">
          <h3 className="text-foreground text-lg font-bold">Edit User</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <Icon name="close" size="md" />
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <Label className="text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase">
              Full Name
            </Label>
            <Input
              type="text"
              className="mt-2 h-10 px-4"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase">
              Email Address <span className="text-xs font-normal opacity-70">(Read Only)</span>
            </Label>
            <Input
              type="email"
              className="mt-2 h-10 cursor-not-allowed px-4 opacity-50"
              value={editingUser.email}
              disabled
            />
          </div>

          {editingUser.role === 'student' && (
            <div>
              <Label className="text-muted-foreground mb-1.5 block text-xs font-bold tracking-wider uppercase">
                Grade
              </Label>
              <Select
                value={editingUser.grade}
                onValueChange={(v) => setEditingUser({ ...editingUser, grade: v })}
              >
                <SelectTrigger className="border-border bg-card text-foreground mt-2 h-10 w-full">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="mt-2 flex-1 font-bold">
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleSave} className="mt-2 flex-1 font-bold">
              <Icon name="save" size="sm" filled className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
