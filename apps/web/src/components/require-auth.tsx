'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';

export function RequireAuth({
  children,
  nextPath,
}: {
  children: ReactNode;
  nextPath: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/entrar?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, user, router, nextPath]);

  if (loading || !user) {
    return (
      <main id="conteudo-principal" className="flex-1 px-4 py-10 lg:px-8">
        <p>Carregando…</p>
      </main>
    );
  }

  return children;
}
