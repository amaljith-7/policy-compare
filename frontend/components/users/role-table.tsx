'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoles } from '@/hooks/use-users';
import { RoleModal } from './role-modal';
import type { Role } from '@/lib/types';

export function RoleTable() {
  const { data, isLoading } = useRoles();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const roles = data?.results || (Array.isArray(data) ? data : []);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No roles found
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role: Role) => {
              const permCount = Object.values(role.permissions || {}).filter(Boolean).length;
              return (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    {role.is_default && <Badge>Default</Badge>}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{permCount} permissions</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRole(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <RoleModal
        open={modalOpen || !!editRole}
        onOpenChange={(open) => {
          if (!open) {
            setModalOpen(false);
            setEditRole(null);
          }
        }}
        role={editRole || undefined}
      />
    </>
  );
}
