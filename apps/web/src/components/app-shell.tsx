'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';

const NAV = [
  { href: '/painel', label: 'Início' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/orcamentos', label: 'Orçamentos' },
  { href: '/investimentos', label: 'Investimentos' },
  { href: '/relatorios', label: 'Relatórios' },
  { href: '/familia', label: 'Família' },
  { href: '/ajustes', label: 'Ajustes' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout, activeGroup, setActiveGroupId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-zinc-50 lg:flex lg:flex-col dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <Link href="/painel" className="text-sm font-semibold tracking-tight">
            Gestão Financeira
          </Link>
        </div>
        <nav aria-label="Seções" className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm ${
                  current
                    ? 'bg-foreground text-background'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <p className="truncate px-3 text-xs text-zinc-600 dark:text-zinc-400">
            {loading ? 'Carregando…' : (user?.name ?? '')}
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold lg:hidden">Gestão Financeira</p>
            {user && user.groups.length > 0 ? (
              <div className="flex max-w-md flex-1 flex-col gap-1">
                <label htmlFor="shell-group" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Grupo
                </label>
                <select
                  id="shell-group"
                  value={activeGroup?.id ?? ''}
                  onChange={(event) => setActiveGroupId(event.target.value)}
                  className="rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
                >
                  {user.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </header>
        {children}
      </div>

      <nav
        aria-label="Seções"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-background lg:hidden dark:border-zinc-800"
      >
        <ul className="flex overflow-x-auto">
          {NAV.map((item) => {
            const current = pathname === item.href;
            return (
              <li key={item.href} className="min-w-[4.5rem] flex-1">
                <Link
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={`flex items-center justify-center px-2 py-3 text-center text-xs ${
                    current ? 'font-semibold' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
