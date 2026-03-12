'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteTable } from '@/components/quotes/quote-table';
import { QuoteFilters } from '@/components/quotes/quote-filters';
import { CompareModal } from '@/components/quotes/compare-modal';
import { PermissionGuard } from '@/components/shared/permission-guard';
import { PERMISSIONS } from '@/lib/constants';

export default function QuotesPage() {
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [viewQuoteId, setViewQuoteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: string;
    product_type?: string;
    owned_by?: string;
    search?: string;
    page: number;
  }>({ page: 1 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <PermissionGuard permission={PERMISSIONS.QUOTES_CREATE}>
          <Button onClick={() => setCompareModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Compare New Quote
          </Button>
        </PermissionGuard>
      </div>
      <QuoteFilters filters={filters} onChange={setFilters} />
      <QuoteTable
        filters={filters}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onViewDetails={(id) => setViewQuoteId(id)}
      />
      <CompareModal
        open={compareModalOpen || !!viewQuoteId}
        onOpenChange={(open) => {
          if (!open) {
            setCompareModalOpen(false);
            setViewQuoteId(null);
          }
        }}
        quoteId={viewQuoteId}
      />
    </div>
  );
}
