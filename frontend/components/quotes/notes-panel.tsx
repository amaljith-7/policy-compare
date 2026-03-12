'use client';

import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useQuote, useUpdateQuote } from '@/hooks/use-quotes';

interface NotesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string | null;
}

export function NotesPanel({ open, onOpenChange, quoteId }: NotesPanelProps) {
  const { data: quote } = useQuote(quoteId);
  const updateQuote = useUpdateQuote();
  const [notes, setNotes] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (quote) {
      setNotes(quote.notes || '');
    }
  }, [quote]);

  const handleChange = (value: string) => {
    setNotes(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (quoteId) {
        updateQuote.mutate({ id: quoteId, data: { notes: value } });
      }
    }, 3000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notes</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <Textarea
            value={notes}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Add notes about this quote..."
            className="min-h-[300px] resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Notes are auto-saved after 3 seconds
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
