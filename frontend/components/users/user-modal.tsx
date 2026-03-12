'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateUser, useUpdateUser, useRoles } from '@/hooks/use-users';
import type { User, Role } from '@/lib/types';

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  full_name: z.string().min(1, 'Name is required'),
  password: z.string().optional(),
  role_id: z.string().optional(),
  is_active: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserModal({ open, onOpenChange, user }: UserModalProps) {
  const isEditing = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: rolesData } = useRoles();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      full_name: '',
      password: '',
      role_id: '',
      is_active: true,
    },
  });

  const roles = rolesData?.results || (Array.isArray(rolesData) ? rolesData : []);

  useEffect(() => {
    if (open) {
      reset({
        email: user?.email || '',
        full_name: user?.full_name || '',
        password: '',
        role_id: user?.role?.id || '',
        is_active: user?.is_active ?? true,
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: UserFormData) => {
    if (isEditing) {
      const { password, ...updateData } = data;
      await updateUser.mutateAsync({ id: user.id, data: updateData as Partial<User> });
    } else {
      if (!data.password || data.password.length < 8) return;
      await createUser.mutateAsync({
        email: data.email,
        full_name: data.full_name,
        password: data.password,
        role_id: data.role_id,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register('full_name')} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={watch('role_id') || ''} onValueChange={(value) => value && setValue('role_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role: Role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_active')} onCheckedChange={(checked) => setValue('is_active', checked)} />
            <Label>Active</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
