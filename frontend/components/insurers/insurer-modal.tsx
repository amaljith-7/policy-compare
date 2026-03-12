'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCreateInsurer, useUpdateInsurer } from '@/hooks/use-insurers';
import type { Insurer } from '@/lib/types';

const insurerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type InsurerForm = z.infer<typeof insurerSchema>;

interface InsurerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurer?: Insurer;
}

export function InsurerModal({ open, onOpenChange, insurer }: InsurerModalProps) {
  const createInsurer = useCreateInsurer();
  const updateInsurer = useUpdateInsurer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!insurer;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InsurerForm>({
    resolver: zodResolver(insurerSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ name: insurer?.name || '' });
    }
  }, [open, insurer, reset]);

  const onSubmit = async (data: InsurerForm) => {
    const formData = new FormData();
    formData.append('name', data.name);
    const logoFile = fileInputRef.current?.files?.[0];
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    if (isEditing) {
      await updateInsurer.mutateAsync({ id: insurer.id, data: formData });
    } else {
      await createInsurer.mutateAsync(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Insurer' : 'Add Insurer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" type="file" accept="image/*" ref={fileInputRef} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInsurer.isPending || updateInsurer.isPending}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
