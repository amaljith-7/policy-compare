'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background border p-3 text-left text-sm font-medium min-w-[200px]">
              Field
            </th>
            {insurers.map((insurer) => (
              <th key={insurer.insurer_id} className="border p-3 text-left text-sm font-medium min-w-[200px]">
                {insurer.insurer_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.key} className="group">
              <td className="sticky left-0 z-10 bg-background border p-3 text-sm font-medium">
                <div className="flex items-center gap-1">
                  <EditableCell
                    value={field.label}
                    onSave={(value) => onFieldLabelEdit(field.key, value)}
                    className="font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => onDeleteField(field.key)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </td>
              {insurers.map((insurer) => (
                <td key={insurer.insurer_id} className="border p-3 text-sm">
                  <EditableCell
                    value={insurer.fields[field.key] || '-'}
                    onSave={(value) => onCellEdit(insurer.insurer_id, field.key, value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
