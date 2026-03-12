'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Building2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useHasPermission } from '@/hooks/use-auth';
import { PERMISSIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { href: '/quotes', label: 'Quotes', icon: FileText, permission: PERMISSIONS.QUOTES_VIEW },
  { href: '/insurers', label: 'Insurers', icon: Building2, permission: PERMISSIONS.INSURERS_VIEW },
  { href: '/users', label: 'Users', icon: Users, permission: PERMISSIONS.USERS_MANAGE },
];

function NavItem({ item, collapsed }: { item: typeof navItems[0]; collapsed: boolean }) {
  const pathname = usePathname();
  const hasPermission = useHasPermission(item.permission);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  if (!hasPermission) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const collapsed = !sidebarOpen;

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && <span className="text-lg font-bold">Prominent</span>}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto h-8 w-8', collapsed && 'mx-auto')}
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}
