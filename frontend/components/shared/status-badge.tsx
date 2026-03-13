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
    <Badge variant="secondary" className={cn(statusConfig.color, className)}>
      {statusConfig.label}
    </Badge>
  );
}
