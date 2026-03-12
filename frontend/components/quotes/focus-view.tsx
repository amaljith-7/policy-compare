'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableCell } from './editable-cell';
import type { InsurerData } from '@/lib/types';

interface FocusViewProps {
  fields: Array<{ key: string; label: string }>;
  insurers: InsurerData[];
  onCellEdit: (insurerId: string, fieldKey: string, value: string) => void;
  onFieldLabelEdit: (fieldKey: string, newLabel: string) => void;
  onDeleteField: (fieldKey: string) => void;
}

export function FocusView({ fields, insurers, onCellEdit, onFieldLabelEdit, onDeleteField }: FocusViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, insurers.length - 1));
  }, [insurers.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (insurers.length === 0) {
    return <p className="text-center text-muted-foreground">No insurers to display</p>;
  }

  const currentInsurer = insurers[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-semibold">{currentInsurer.insurer_name}</h3>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {insurers.length}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={goNext} disabled={currentIndex === insurers.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {fields.map((field) => (
          <div key={field.key} className="group flex border rounded-lg">
            <div className="w-1/2 p-3 bg-muted/50 flex items-center gap-1">
              <EditableCell
                value={field.label}
                onSave={(value) => onFieldLabelEdit(field.key, value)}
                className="font-medium text-sm"
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
            <div className="w-1/2 p-3">
              <EditableCell
                value={currentInsurer.fields[field.key] || '-'}
                onSave={(value) => onCellEdit(currentInsurer.insurer_id, field.key, value)}
                className="text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
