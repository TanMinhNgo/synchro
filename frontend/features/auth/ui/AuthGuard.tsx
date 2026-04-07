'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../model/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = React.useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      const next = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/login?next=${next}`);
      return;
    }
    setOk(true);
  }, [router, pathname, isAuthenticated]);

  if (!ok) return null;
  return <>{children}</>;
}
