'use client';

import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pagination } from '@/components/shared/pagination';
import { useQuotes, useUpdateQuote, useDeleteQuote } from '@/hooks/use-quotes';
import { PermissionGuard } from '@/components/shared/permission-guard';
import { PERMISSIONS, QUOTE_STATUSES, ITEMS_PER_PAGE } from '@/lib/constants';
import type { Quote, QuoteStatus } from '@/lib/types';

interface QuoteTableProps {
  filters: {
    status?: string;
    product_type?: string;
    owned_by?: string;
    search?: string;
    page: number;
  };
  onPageChange: (page: number) => void;
  onViewDetails: (id: string) => void;
}

export function QuoteTable({ filters, onPageChange, onViewDetails }: QuoteTableProps) {
  const { data, isLoading } = useQuotes(filters);
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const quotes = data?.results || [];
  const totalPages = data?.count ? Math.ceil(data.count / ITEMS_PER_PAGE) : 1;

  const handleStatusChange = (quoteId: string, newStatus: string) => {
    updateQuote.mutate({ id: quoteId, data: { status: newStatus } });
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote No.</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No quotes found
              </TableCell>
            </TableRow>
          ) : (
            quotes.map((quote: Quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.quote_no}</TableCell>
                <TableCell>{quote.customer_name}</TableCell>
                <TableCell>{quote.product_type}</TableCell>
                <TableCell>
                  <PermissionGuard
                    permission={PERMISSIONS.QUOTES_EDIT}
                    fallback={<StatusBadge status={quote.status} />}
                  >
                    <Select
                      value={quote.status}
                      onValueChange={(value) => value && handleStatusChange(quote.id, value)}
                    >
                      <SelectTrigger className="h-7 w-[130px]">
                        <SelectValue>
                          <StatusBadge status={quote.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(QUOTE_STATUSES).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PermissionGuard>
                </TableCell>
                <TableCell>{quote.owned_by?.full_name || '-'}</TableCell>
                <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" />}
                      className="h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(quote.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <PermissionGuard permission={PERMISSIONS.QUOTES_DELETE}>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteQuote.mutate(quote.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </PermissionGuard>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex justify-center">
        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
