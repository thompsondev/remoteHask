'use client';

import { LayoutDashboard, Monitor, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/devices', label: 'Devices', icon: Monitor },
  { href: '/dashboard/sessions', label: 'Sessions', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="truncate font-semibold tracking-tight">
          {collapsed ? 'RH' : 'remoteHask'}
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? <span>{label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
