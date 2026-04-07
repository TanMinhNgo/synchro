import { Suspense } from 'react';
import { LoginForm } from '@/features/auth';

export const metadata = {
  title: 'Login - Synchro',
  description: 'Login to your Synchro account',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
