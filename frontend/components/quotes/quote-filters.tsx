'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { X, Search } from 'lucide-react';
import { PRODUCT_TYPES, QUOTE_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface QuoteFiltersProps {
  filters: {
    status?: string;
    product_type?: string;
    owned_by?: string;
    search?: string;
    page: number;
  };
  onChange: (filters: QuoteFiltersProps['filters']) => void;
}

export function QuoteFilters({ filters, onChange }: QuoteFiltersProps) {
  const setFilter = (key: string, value: string | undefined) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onChange({ page: 1 });
  };

  const hasFilters = filters.status || filters.product_type || filters.search;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {Object.entries(QUOTE_STATUSES).map(([value, config]) => (
          <button
            key={value}
            aria-pressed={filters.status === value}
            onClick={() => setFilter('status', filters.status === value ? undefined : value)}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
              filters.status === value
                ? config.color
                : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            {config.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <InputGroup className="flex-1 max-w-sm">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by customer name..."
            value={filters.search || ''}
            onChange={(e) => setFilter('search', e.target.value || undefined)}
          />
        </InputGroup>
        <Select
          value={filters.product_type || 'all'}
          onValueChange={(value) => setFilter('product_type', value === 'all' ? undefined : value || undefined)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Product Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {PRODUCT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
