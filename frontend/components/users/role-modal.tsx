'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreateRole, useUpdateRole } from '@/hooks/use-users';
import { PERMISSIONS } from '@/lib/constants';
import type { Role } from '@/lib/types';

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

interface RoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
}

const PERMISSION_LABELS: Record<string, string> = {
  'quotes.view': 'View Quotes',
  'quotes.create': 'Create Quotes',
  'quotes.edit': 'Edit Quotes',
  'quotes.delete': 'Delete Quotes',
  'quotes.share': 'Share Quotes',
  'insurers.view': 'View Insurers',
  'insurers.manage': 'Manage Insurers',
  'users.view': 'View Users',
  'users.manage': 'Manage Users',
  'roles.view': 'View Roles',
  'roles.manage': 'Manage Roles',
  'dashboard.view': 'View Dashboard',
};

export function RoleModal({ open, onOpenChange, role }: RoleModalProps) {
  const isEditing = !!role;
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '' },
  });

  const allPermKeys = Object.values(PERMISSIONS);
  const initialPerms: Record<string, boolean> = {};
  allPermKeys.forEach((p) => (initialPerms[p] = false));

  const [permissions, setPermissions] = useState<Record<string, boolean>>(role?.permissions || initialPerms);

  useEffect(() => {
    if (open) {
      reset({ name: role?.name || '' });
      setPermissions(role?.permissions || initialPerms);
    }
  }, [open, role, reset]);

  const onSubmit = async (data: { name: string }) => {
    const payload = { ...data, permissions };
    if (isEditing) {
      await updateRole.mutateAsync({ id: role.id, data: payload });
    } else {
      await createRole.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Add Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2">
              {allPermKeys.map((perm) => (
                <div key={perm} className="flex items-center gap-2">
                  <Switch
                    checked={permissions[perm] || false}
                    onCheckedChange={(checked) =>
                      setPermissions((prev) => ({ ...prev, [perm]: checked }))
                    }
                  />
                  <span className="text-sm">{PERMISSION_LABELS[perm] || perm}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
