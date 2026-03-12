'use client';

import { cn } from '@/lib/utils';
import type { InsurerData } from '@/lib/types';

interface InsurerFilterChipsProps {
  insurers: InsurerData[];
  visible: Set<string>;
  onToggle: (id: string) => void;
}

export function InsurerFilterChips({ insurers, visible, onToggle }: InsurerFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {insurers.map((insurer) => (
        <button
          key={insurer.insurer_id}
          onClick={() => onToggle(insurer.insurer_id)}
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
            visible.has(insurer.insurer_id)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {insurer.insurer_name}
        </button>
      ))}
    </div>
  );
}
