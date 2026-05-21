'use client';

import { Menu, Wifi, WifiOff } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogoutMutation } from '@/features/auth/hooks/use-auth';
import { useSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';

export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const organizations = useAuthStore((s) => s.organizations);
  const currentOrganizationId = useAuthStore((s) => s.currentOrganizationId);
  const setCurrentOrganizationId = useAuthStore((s) => s.setCurrentOrganizationId);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { isConnected } = useSocket();
  const logout = useLogoutMutation();

  const currentOrg = organizations.find((o) => o.id === currentOrganizationId);
  const initials =
    user?.displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentOrg?.name ?? 'No organization'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title={isConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
        >
          {isConnected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {isConnected ? 'Live' : 'Offline'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.length > 1
              ? organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => {
                      setCurrentOrganizationId(org.id);
                    }}
                    className={org.id === currentOrganizationId ? 'bg-accent' : undefined}
                  >
                    {org.name}
                  </DropdownMenuItem>
                ))
              : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout.mutate(undefined);
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
