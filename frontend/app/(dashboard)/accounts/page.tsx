'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCurrentUser, useUpdateProfile } from '@/features/auth';

export default function AccountsPage() {
  const currentUserQuery = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();

  const user = currentUserQuery.data;

  const [name, setName] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');

  React.useEffect(() => {
    setName(user?.name ?? '');
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [user?.name, user?.avatarUrl]);

  const avatarSrc = React.useMemo(() => {
    const local = avatarUrl.trim();
    if (local) return local;
    const remote = user?.avatarUrl;
    return typeof remote === 'string' && remote.trim() ? remote : undefined;
  }, [avatarUrl, user?.avatarUrl]);

  const canSave = Boolean(user) && !updateProfileMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">
          Manage linked accounts and access.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Update your display name and avatar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUserQuery.isError && (
            <div className="text-sm text-destructive">
              {(currentUserQuery.error as Error | undefined)?.message ??
                'Failed to load user'}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={avatarSrc} alt={name || user?.name || 'User'} />
              <AvatarFallback>
                {(name || user?.name || 'U').slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium">{user?.email ?? '—'}</div>
              <div className="text-sm text-muted-foreground">
                Signed-in account
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={!user}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="avatarUrl">
                Avatar URL
              </label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                disabled={!user}
              />
            </div>
          </div>

          {updateProfileMutation.isError && (
            <div className="text-sm text-destructive">
              {(updateProfileMutation.error as Error | undefined)?.message ??
                'Failed to update profile'}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              disabled={!user || updateProfileMutation.isPending}
              onClick={() => {
                setName(user?.name ?? '');
                setAvatarUrl(user?.avatarUrl ?? '');
              }}
            >
              Reset
            </Button>
            <Button
              disabled={!canSave}
              onClick={() =>
                updateProfileMutation.mutate({
                  name: name.trim() || undefined,
                  avatarUrl: avatarUrl.trim() || undefined,
                })
              }
            >
              {updateProfileMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
