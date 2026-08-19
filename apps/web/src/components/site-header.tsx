'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { BrandMark } from '@/components/brand-mark';
import { btnGhostClass, btnPrimaryClass } from '@/lib/ui';

const APP_PREFIXES = [
  '/painel',
  '/lancamentos',
  '/orcamentos',
  '/investimentos',
  '/relatorios',
  '/familia',
  '/ajustes',
];

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="border-b border-line/80 px-6 py-4">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <BrandMark href={user ? '/painel' : '/'} compact />
        <nav aria-label="Principal" className="flex items-center gap-2 text-sm">
          {loading ? (
            <span className="text-muted">Carregando…</span>
          ) : user ? (
            <>
              <span className="hidden text-muted sm:inline">{user.name}</span>
              <Link className={btnGhostClass} href="/painel">
                Início
              </Link>
              <button type="button" onClick={() => void handleLogout()} className={btnGhostClass}>
                Sair
              </button>
            </>
          ) : (
            <>
              <Link className={btnGhostClass} href="/entrar">
                Entrar
              </Link>
              <Link className={btnPrimaryClass} href="/cadastro">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
