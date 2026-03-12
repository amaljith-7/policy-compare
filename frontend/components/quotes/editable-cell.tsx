'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
}

export function EditableCell({ value, onSave, className }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full bg-transparent border-b border-primary outline-none px-0 py-0',
          className
        )}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn('cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1', className)}
    >
      {value || '-'}
    </span>
  );
}
