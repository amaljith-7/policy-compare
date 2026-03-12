'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { Insurer, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

export function useInsurers(enabled?: boolean) {
  return useQuery<PaginatedResponse<Insurer>>({
    queryKey: ['insurers', { enabled }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (enabled !== undefined) params.enabled = String(enabled);
      const response = await apiClient.get('/insurers/', { params });
      return response.data;
    },
  });
}

export function useCreateInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiClient.post('/insurers/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
      toast.success('Insurer created successfully');
    },
    onError: () => toast.error('Failed to create insurer'),
  });
}

export function useUpdateInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await apiClient.patch(`/insurers/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
      toast.success('Insurer updated successfully');
    },
    onError: () => toast.error('Failed to update insurer'),
  });
}

export function useDeleteInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/insurers/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
      toast.success('Insurer deleted successfully');
    },
    onError: () => toast.error('Failed to delete insurer'),
  });
}

export function useToggleInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const response = await apiClient.patch(`/insurers/${id}/`, { is_enabled });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
    },
  });
}
