'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { Quote, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import { ITEMS_PER_PAGE } from '@/lib/constants';

interface QuoteFilters {
  status?: string;
  product_type?: string;
  owned_by?: string;
  search?: string;
  page?: number;
}

export function useQuotes(filters: QuoteFilters = {}) {
  return useQuery<PaginatedResponse<Quote>>({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.product_type) params.product_type = filters.product_type;
      if (filters.owned_by) params.owned_by = filters.owned_by;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = String(filters.page);
      const response = await apiClient.get('/quotes/', { params });
      return response.data;
    },
  });
}

export function useQuote(id: string | null) {
  return useQuery<Quote>({
    queryKey: ['quote', id],
    queryFn: async () => {
      const response = await apiClient.get(`/quotes/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      product_type: string;
      insurer_ids?: string[];
      status?: string;
      notes?: string;
      comparison_data?: Record<string, unknown>;
    }) => {
      const response = await apiClient.post('/quotes/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote created successfully');
    },
    onError: () => toast.error('Failed to create quote'),
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await apiClient.patch(`/quotes/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', variables.id] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/quotes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote deleted successfully');
    },
    onError: () => toast.error('Failed to delete quote'),
  });
}

export function useExtractPdf() {
  return useMutation({
    mutationFn: async ({ pdf, insurer_id, product_type }: { pdf: File; insurer_id: string; product_type: string }) => {
      const formData = new FormData();
      formData.append('pdf', pdf);
      formData.append('insurer_id', insurer_id);
      formData.append('product_type', product_type);
      const response = await apiClient.post('/quotes/extract/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  });
}

export function useShareQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/quotes/${id}/share/`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      toast.success('Quote shared successfully');
    },
    onError: () => toast.error('Failed to share quote'),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/');
      return response.data;
    },
  });
}
