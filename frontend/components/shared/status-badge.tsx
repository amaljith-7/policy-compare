import { Badge } from '@/components/ui/badge';
import { QUOTE_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = QUOTE_STATUSES[status];
  if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig.color, className)}>
      {statusConfig.label}
    </span>
  );
}
