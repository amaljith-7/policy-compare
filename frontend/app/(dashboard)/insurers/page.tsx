'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsurerTable } from '@/components/insurers/insurer-table';
import { InsurerModal } from '@/components/insurers/insurer-modal';
import { PermissionGuard } from '@/components/shared/permission-guard';
import { PERMISSIONS } from '@/lib/constants';

export default function InsurersPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insurers</h1>
        <PermissionGuard permission={PERMISSIONS.INSURERS_MANAGE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Insurer
          </Button>
        </PermissionGuard>
      </div>
      <InsurerTable />
      <InsurerModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
