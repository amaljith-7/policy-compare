'use client';

import { useHasPermission } from '@/hooks/use-auth';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const hasPermission = useHasPermission(permission);
  if (!hasPermission) return <>{fallback}</>;
  return <>{children}</>;
}
