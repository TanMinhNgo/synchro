'use client';

import * as React from 'react';
import { useCurrentUser, useLogout } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { Search, Share2, MoreHorizontal, ChevronRight, UserPlus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const pathname = usePathname();

  // Simple formatting for breadcrumb
  const pageName = pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard';
  const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <header className="flex h-[72px] items-center justify-between border-b bg-background px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>Synchro</span>
        <ChevronRight className="h-4 w-4" />
        <div className="flex items-center gap-2 text-foreground">
          <div className="flex items-center h-6 px-2 py-1 bg-muted rounded-md gap-1">
            <span className="text-black/70">◫</span>
            <span>{formattedPageName === 'Tasks' ? 'My Task' : formattedPageName}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search task..." 
            className="w-full bg-muted/30 pl-9 rounded-full h-9 border-none text-sm focus-visible:ring-1" 
          />
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50">
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </Button>

        <div className="flex items-center gap-3 border-l pl-4 ml-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">3 min ago</span>
            <div className="flex -space-x-2">
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/150?img=1" />
              </Avatar>
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/150?img=2" />
              </Avatar>
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/150?img=3" />
              </Avatar>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +2
              </div>
            </div>
          </div>

          <Button className="h-9 rounded-xl font-medium px-4 gap-2">
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 border rounded-xl">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {user && (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Log out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
