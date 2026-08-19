'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { useAuth } from '@/components/auth-provider';
import { fieldClass } from '@/lib/ui';

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
      <aside className="hidden w-64 shrink-0 border-r border-line bg-card/70 lg:flex lg:flex-col">
        <div className="border-b border-line px-4 py-5">
          <BrandMark href="/painel" />
        </div>
        <nav aria-label="Seções" className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={`rounded-xl px-3 py-2.5 text-sm ${
                  current
                    ? 'bg-accent text-accent-fg'
                    : 'text-foreground/80 hover:bg-line/70'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <p className="truncate px-3 text-xs text-muted">
            {loading ? 'Carregando…' : (user?.name ?? '')}
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-line/70"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="border-b border-line px-4 py-3 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="lg:hidden">
              <BrandMark href="/painel" compact />
            </div>
            {user && user.groups.length > 0 ? (
              <div className="flex max-w-md flex-1 flex-col gap-1">
                <label htmlFor="shell-group" className="text-xs font-medium text-muted">
                  Grupo
                </label>
                <select
                  id="shell-group"
                  value={activeGroup?.id ?? ''}
                  onChange={(event) => setActiveGroupId(event.target.value)}
                  className={fieldClass}
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur lg:hidden"
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
                    current ? 'font-semibold text-accent' : 'text-muted'
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
