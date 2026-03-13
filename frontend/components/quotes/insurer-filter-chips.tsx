'use client';

import { Toggle } from '@/components/ui/toggle';
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
        <Toggle
          key={insurer.insurer_id}
          size="sm"
          pressed={visible.has(insurer.insurer_id)}
          onPressedChange={() => onToggle(insurer.insurer_id)}
          className="rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {insurer.insurer_name}
        </Toggle>
      ))}
    </div>
  );
}
