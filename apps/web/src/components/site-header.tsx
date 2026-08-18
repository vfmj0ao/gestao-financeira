'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <Link href={user ? '/painel' : '/'} className="text-sm font-semibold tracking-tight">
          Gestão Financeira
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-3 text-sm">
          {loading ? (
            <span className="text-zinc-500">Carregando…</span>
          ) : user ? (
            <>
              <span className="hidden text-zinc-600 sm:inline dark:text-zinc-400">{user.name}</span>
              <Link
                className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                href="/painel"
              >
                Painel
              </Link>
              <Link
                className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                href="/relatorios"
              >
                Relatórios
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                href="/entrar"
              >
                Entrar
              </Link>
              <Link
                className="rounded-md bg-foreground px-3 py-2 text-background hover:opacity-90"
                href="/cadastro"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
