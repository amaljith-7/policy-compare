'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInsurers, useToggleInsurer, useDeleteInsurer } from '@/hooks/use-insurers';
import { PermissionGuard } from '@/components/shared/permission-guard';
import { PERMISSIONS } from '@/lib/constants';
import { InsurerModal } from './insurer-modal';
import type { Insurer } from '@/lib/types';

export function InsurerTable() {
  const { data, isLoading } = useInsurers();
  const toggleInsurer = useToggleInsurer();
  const deleteInsurer = useDeleteInsurer();
  const [editInsurer, setEditInsurer] = useState<Insurer | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const insurers = data?.results || (Array.isArray(data) ? data : []);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {insurers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No insurers found
              </TableCell>
            </TableRow>
          ) : (
            insurers.map((insurer: Insurer) => (
              <TableRow key={insurer.id}>
                <TableCell>
                  {insurer.logo ? (
                    <img src={insurer.logo} alt={insurer.name} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-medium">
                      {insurer.name[0]}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{insurer.name}</TableCell>
                <TableCell>
                  <PermissionGuard
                    permission={PERMISSIONS.INSURERS_MANAGE}
                    fallback={<span className="text-sm">{insurer.is_enabled ? 'Yes' : 'No'}</span>}
                  >
                    <Switch
                      checked={insurer.is_enabled}
                      onCheckedChange={(checked) =>
                        toggleInsurer.mutate({ id: insurer.id, is_enabled: checked })
                      }
                    />
                  </PermissionGuard>
                </TableCell>
                <TableCell>{new Date(insurer.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <PermissionGuard permission={PERMISSIONS.INSURERS_MANAGE}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditInsurer(insurer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteInsurer.mutate(insurer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </PermissionGuard>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <InsurerModal
        open={!!editInsurer}
        onOpenChange={(open) => !open && setEditInsurer(null)}
        insurer={editInsurer || undefined}
      />
    </>
  );
}
