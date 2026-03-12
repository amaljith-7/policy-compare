'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Columns, Download, Printer, Share2, Plus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PreviewTable } from './preview-table';
import { FocusView } from './focus-view';
import { InsurerFilterChips } from './insurer-filter-chips';
import { NotesPanel } from './notes-panel';
import { ShareActions } from './share-actions';
import type { ComparisonData } from '@/lib/types';

interface ComparisonStageProps {
  data: ComparisonData;
  quoteId: string | null;
  onSave: (data: ComparisonData) => void;
  customerName: string;
}

export function ComparisonStage({ data, quoteId, onSave, customerName }: ComparisonStageProps) {
  const [mode, setMode] = useState<'preview' | 'focus'>('preview');
  const [comparisonData, setComparisonData] = useState<ComparisonData>(data);
  const [visibleInsurers, setVisibleInsurers] = useState<Set<string>>(
    new Set(data.insurers.map((i) => i.insurer_id))
  );
  const [notesOpen, setNotesOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with 3s debounce
  const debouncedSave = useCallback(
    (newData: ComparisonData) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSave(newData);
      }, 3000);
    },
    [onSave]
  );

  const handleDataChange = useCallback(
    (newData: ComparisonData) => {
      setComparisonData(newData);
      debouncedSave(newData);
    },
    [debouncedSave]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Save immediately on unmount
        onSave(comparisonData);
      }
    };
  }, []);

  const handleAddField = () => {
    const key = `custom_${Date.now()}`;
    const newData: ComparisonData = {
      ...comparisonData,
      fields: [...comparisonData.fields, { key, label: 'New Field' }],
      insurers: comparisonData.insurers.map((ins) => ({
        ...ins,
        fields: { ...ins.fields, [key]: '-' },
      })),
    };
    handleDataChange(newData);
  };

  const handleDeleteField = (fieldKey: string) => {
    const newData: ComparisonData = {
      ...comparisonData,
      fields: comparisonData.fields.filter((f) => f.key !== fieldKey),
      insurers: comparisonData.insurers.map((ins) => {
        const fields = { ...ins.fields };
        delete fields[fieldKey];
        return { ...ins, fields };
      }),
    };
    handleDataChange(newData);
  };

  const handleCellEdit = (insurerId: string, fieldKey: string, value: string) => {
    const newData: ComparisonData = {
      ...comparisonData,
      insurers: comparisonData.insurers.map((ins) =>
        ins.insurer_id === insurerId
          ? { ...ins, fields: { ...ins.fields, [fieldKey]: value } }
          : ins
      ),
    };
    handleDataChange(newData);
  };

  const handleFieldLabelEdit = (fieldKey: string, newLabel: string) => {
    const newData: ComparisonData = {
      ...comparisonData,
      fields: comparisonData.fields.map((f) =>
        f.key === fieldKey ? { ...f, label: newLabel } : f
      ),
    };
    handleDataChange(newData);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInsurers = comparisonData.insurers.filter((i) =>
    visibleInsurers.has(i.insurer_id)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3 flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-lg font-semibold">{customerName || 'Quote Comparison'}</h2>
          <p className="text-sm text-muted-foreground">
            {comparisonData.insurers.length} insurers, {comparisonData.fields.length} fields
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={mode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setMode('preview')}
            >
              <Eye className="mr-1 h-4 w-4" />
              Preview
            </Button>
            <Button
              variant={mode === 'focus' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setMode('focus')}
            >
              <Columns className="mr-1 h-4 w-4" />
              Focus
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddField}>
            <Plus className="mr-1 h-4 w-4" />
            Add Field
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)}>
            <StickyNote className="mr-1 h-4 w-4" />
            Notes
          </Button>
          <ShareActions quoteId={quoteId} comparisonData={comparisonData} customerName={customerName} />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-6 py-2 print:hidden">
        <InsurerFilterChips
          insurers={comparisonData.insurers}
          visible={visibleInsurers}
          onToggle={(id) => {
            setVisibleInsurers((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 pt-2">
        {mode === 'preview' ? (
          <PreviewTable
            fields={comparisonData.fields}
            insurers={filteredInsurers}
            onCellEdit={handleCellEdit}
            onFieldLabelEdit={handleFieldLabelEdit}
            onDeleteField={handleDeleteField}
          />
        ) : (
          <FocusView
            fields={comparisonData.fields}
            insurers={filteredInsurers}
            onCellEdit={handleCellEdit}
            onFieldLabelEdit={handleFieldLabelEdit}
            onDeleteField={handleDeleteField}
          />
        )}
      </div>

      <NotesPanel open={notesOpen} onOpenChange={setNotesOpen} quoteId={quoteId} />
    </div>
  );
}
