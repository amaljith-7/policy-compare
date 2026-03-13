'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EditableCell } from './editable-cell';
import type { InsurerData } from '@/lib/types';

interface PreviewTableProps {
  fields: Array<{ key: string; label: string }>;
  insurers: InsurerData[];
  onCellEdit: (insurerId: string, fieldKey: string, value: string) => void;
  onFieldLabelEdit: (fieldKey: string, newLabel: string) => void;
  onDeleteField: (fieldKey: string) => void;
}

export function PreviewTable({ fields, insurers, onCellEdit, onFieldLabelEdit, onDeleteField }: PreviewTableProps) {
  return (
    <Table className="min-w-max">
      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 z-10 bg-background min-w-[200px]">
            Field
          </TableHead>
          {insurers.map((insurer) => (
            <TableHead key={insurer.insurer_id} className="min-w-[200px]">
              {insurer.insurer_name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.key} className="group">
            <TableCell className="sticky left-0 z-10 bg-background font-medium">
              <div className="flex items-center gap-1">
                <EditableCell
                  value={field.label}
                  onSave={(value) => onFieldLabelEdit(field.key, value)}
                  className="font-medium"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => onDeleteField(field.key)}
                >
                  <X />
                </Button>
              </div>
            </TableCell>
            {insurers.map((insurer) => (
              <TableCell key={insurer.insurer_id}>
                <EditableCell
                  value={insurer.fields[field.key] || '-'}
                  onSave={(value) => onCellEdit(insurer.insurer_id, field.key, value)}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
