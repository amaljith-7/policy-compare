'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { User, Role, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

export function useUsers() {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users/');
      return response.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; full_name: string; password: string; role_id?: string }) => {
      const response = await apiClient.post('/users/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: () => toast.error('Failed to create user'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await apiClient.patch(`/users/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
    },
    onError: () => toast.error('Failed to update user'),
  });
}

export function useRoles() {
  return useQuery<PaginatedResponse<Role>>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get('/roles/');
      return response.data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; permissions: Record<string, boolean>; is_default?: boolean }) => {
      const response = await apiClient.post('/roles/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
    },
    onError: () => toast.error('Failed to create role'),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Role> }) => {
      const response = await apiClient.patch(`/roles/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
    },
    onError: () => toast.error('Failed to update role'),
  });
}
