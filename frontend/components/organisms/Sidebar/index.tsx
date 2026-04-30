'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CheckSquare,
  Inbox,
  PieChart,
  FolderOpen,
  UserCircle,
  Flag,
  HelpCircle,
  Plus,
  PanelLeftClose,
  MoreHorizontal,
  ListMinus,
  MessagesSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/features/auth';
import { useNotificationRealtime, useNotifications } from '@/features/notification';
import { useFavoriteProjects } from '@/features/project/hooks/use-favorite-projects';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Task', href: '/tasks', icon: CheckSquare },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Chat', href: '/chat', icon: MessagesSquare },
  { name: 'Reporting', href: '/reporting', icon: PieChart },
  { name: 'Portfolio', href: '/portfolio', icon: FolderOpen },
  { name: 'Accounts', href: '/accounts', icon: UserCircle },
  { name: 'Goals', href: '/goals', icon: Flag },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const { favorites } = useFavoriteProjects(3);
  const notificationsQuery = useNotifications({ unreadOnly: true });

  useNotificationRealtime();

  const unreadCount = React.useMemo(
    () => notificationsQuery.data?.length ?? 0,
    [notificationsQuery.data],
  );

  return (
    <div className="flex h-full w-65 flex-col border-r bg-background shrink-0">
      {/* User Profile */}
      <div className="flex items-center justify-between p-4 pl-6 pt-6">
        <div className="flex items-center gap-3 w-40 overflow-hidden">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage
              src={user?.avatarUrl || 'https://i.pravatar.cc/150?img=9'}
            />
            <AvatarFallback>{user?.name?.charAt(0) || 'S'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold leading-none truncate">
              {user?.name || 'Sarah Smither'}
            </span>
            <span className="text-xs text-muted-foreground mt-1 truncate">
              {user?.email || 'sarahsmith@mail.com'}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
        >
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>

      {/* Create Task Button */}
      <div className="px-4 pb-4">
        <Button className="w-full justify-center gap-2 rounded-xl" size="lg">
          <Plus className="h-5 w-5" />
          Create Task
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname.startsWith(item.href) || pathname === item.href;
            const count = item.name === 'Inbox' ? unreadCount : item.count;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors font-medium',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
                {count ? (
                  <Badge
                    variant="outline"
                    className="h-5 rounded-md px-1.5 text-xs font-normal border-none bg-secondary text-muted-foreground"
                  >
                    {count}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Favourites Section */}
        <div className="mt-8 px-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-3 px-1">
            <span>Favourite</span>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <nav className="space-y-0.5">
            {favorites.map((item) => (
              <Link
                key={item.projectId}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors font-medium"
              >
                <ListMinus className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 mt-auto">
        <Link
          href="/help"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors font-medium"
        >
          Help Center
          <HelpCircle className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
