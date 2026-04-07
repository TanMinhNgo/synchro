'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useLogout } from '@/features/auth';

export default function SettingsPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const onLogout = React.useCallback(async () => {
    try {
      await logout.mutateAsync();
    } finally {
      router.push('/login');
    }
  }, [logout, router]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={user?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} readOnly disabled />
          </div>
          <div className="flex items-center gap-2">
            <Button>Save Changes</Button>
            <Button variant="destructive" onClick={onLogout} disabled={logout.isPending}>
              {logout.isPending ? 'Logging out…' : 'Log out'}
            </Button>
          </div>

          {logout.isError && (
            <p className="text-sm text-destructive">
              Failed to log out. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
