'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginAction } from '@/shared/types/user';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function LoginForm() {
  const loginMutation = useLogin();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = React.useMemo(() => {
    const next = searchParams.get('next');
    return next && next.startsWith('/') ? next : '/dashboard';
  }, [searchParams]);

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.replace(nextPath);
    }
  }, [router, nextPath]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginAction>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginAction) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Logged in successfully');
        router.push(nextPath);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Login failed');
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2 mb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
