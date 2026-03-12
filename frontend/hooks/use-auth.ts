'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useUIStore } from '@/stores/ui-store';
import type { User } from '@/lib/types';

export function useLogin() {
  const { setUser, setAuthenticated } = useUIStore();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiClient.post('/auth/login/', data);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setUser(data.user);
      setAuthenticated(true);
    },
  });
}

export function useLogout() {
  const { logout } = useUIStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refresh = localStorage.getItem('refresh_token');
      await apiClient.post('/auth/logout/', { refresh });
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useMe() {
  const { setUser, isAuthenticated } = useUIStore();

  return useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me/');
      setUser(response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useHasPermission(permission: string): boolean {
  const user = useUIStore((state) => state.user);
  if (!user) return false;
  if (user.is_superuser) return true;
  const permissions = user.permissions || user.role?.permissions;
  if (!permissions) return false;
  return permissions[permission] === true;
}
