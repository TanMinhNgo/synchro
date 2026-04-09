'use client';

import * as React from 'react';
import { useCurrentUser, useLogout } from '@/features/auth';
import { useVideoCallParticipants } from '@/features/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Share2, MoreHorizontal, ChevronRight, UserPlus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VoiceChat } from '@/components/ui/chat-bubble';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInviteProjectMember } from '@/features/project/hooks/use-invite-project-member';
import { useProject } from '@/features/project/hooks/use-project';

export function Navbar() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const pathname = usePathname();
  const router = useRouter();

  const callId = 'general';
  const { participantsQuery } = useVideoCallParticipants(Boolean(user), callId);
  const callUsers = participantsQuery.data ?? [];

  const [searchValue, setSearchValue] = React.useState('');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');

  const pathSegments = React.useMemo(
    () => pathname.split('/').filter(Boolean),
    [pathname],
  );

  const activeProjectIdOrSlug =
    pathSegments[0] === 'projects' && typeof pathSegments[1] === 'string'
      ? pathSegments[1]
      : null;
  const activeProjectId = activeProjectIdOrSlug ?? '';
  const projectQuery = useProject(activeProjectId);
  const isProjectOwner = Boolean(
    user && projectQuery.data && projectQuery.data.ownerId === user.id,
  );
  const canInvite = Boolean(activeProjectIdOrSlug) && isProjectOwner;

  const inviteMutation = useInviteProjectMember(activeProjectId);

  // Simple formatting for breadcrumb
  const pageName = pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard';
  const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <header className="flex h-18 items-center justify-between border-b bg-background px-6 shrink-0">
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
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const q = searchValue.trim();
              router.push(q ? `/tasks?search=${encodeURIComponent(q)}` : '/tasks');
            }}
          />
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50">
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </Button>

        <div className="flex items-center gap-3 border-l pl-4 ml-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">3 min ago</span>
            <VoiceChat
              users={callUsers}
              onJoin={() => {
                const url = `/chat/call?callId=${encodeURIComponent(callId)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            />
          </div>

          <Button
            className="h-9 rounded-xl font-medium px-4 gap-2"
            disabled={!activeProjectIdOrSlug || projectQuery.isLoading || !isProjectOwner}
            onClick={() => {
              if (!activeProjectIdOrSlug) return;
              if (projectQuery.isLoading) return;
              if (!isProjectOwner) {
                toast.error('Only the project owner can invite members.');
                return;
              }
              setInviteOpen(true);
            }}
          >
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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Invite a teammate to this project by email.
            </div>
            <Input
              type="email"
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const email = inviteEmail.trim();
                if (!activeProjectIdOrSlug) return;
                inviteMutation.mutate(
                  { email },
                  {
                    onSuccess: () => {
                      toast.success('Invitation sent');
                      setInviteEmail('');
                      setInviteOpen(false);
                    },
                    onError: (err) => {
                      toast.error(err instanceof Error ? err.message : 'Invite failed');
                    },
                  },
                );
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const email = inviteEmail.trim();
                if (!activeProjectIdOrSlug) return;
                inviteMutation.mutate(
                  { email },
                  {
                    onSuccess: () => {
                      toast.success('Invitation sent');
                      setInviteEmail('');
                      setInviteOpen(false);
                    },
                    onError: (err) => {
                      toast.error(err instanceof Error ? err.message : 'Invite failed');
                    },
                  },
                );
              }}
              disabled={inviteMutation.isPending || inviteEmail.trim().length === 0}
            >
              {inviteMutation.isPending ? 'Inviting…' : 'Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
