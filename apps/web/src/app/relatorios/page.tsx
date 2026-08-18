'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ReportsPanel } from '@/components/reports-panel';

export default function ReportsPage() {
  const { user, loading, activeGroup, setActiveGroupId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/entrar?next=/relatorios');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main id="conteudo-principal" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p>Carregando relatórios…</p>
      </main>
    );
  }

  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12"
    >
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Gráficos e relatórios</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Acompanhe receitas, despesas e categorias do grupo ativo. Os gráficos são
          visuais; os valores oficiais estão nas tabelas.
        </p>
        {user.groups.length > 0 ? (
          <div className="flex max-w-md flex-col gap-2">
            <label htmlFor="report-group" className="text-sm font-medium">
              Grupo
            </label>
            <select
              id="report-group"
              value={activeGroup?.id ?? ''}
              onChange={(event) => setActiveGroupId(event.target.value)}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            >
              {user.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            Você ainda não participa de um grupo.{' '}
            <Link className="underline" href="/painel">
              Criar no painel
            </Link>
          </p>
        )}
      </section>

      {activeGroup ? (
        <ReportsPanel key={activeGroup.id} groupId={activeGroup.id} />
      ) : null}
    </main>
  );
}
