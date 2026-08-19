'use client';

import { RequireAuth } from '@/components/require-auth';
import { OverviewPanel } from '@/components/overview-panel';
import { useAuth } from '@/components/auth-provider';

export default function HomeDashboardPage() {
  const { user, activeGroup } = useAuth();

  return (
    <RequireAuth nextPath="/painel">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Olá{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Um olhar rápido no mês: o que entrou, o que saiu e se está melhor ou pior que o mês
            passado.
          </p>
        </div>
        {activeGroup ? (
          <OverviewPanel key={activeGroup.id} groupId={activeGroup.id} />
        ) : (
          <p>
            Você ainda não participa de um grupo. Crie um em{' '}
            <a className="underline" href="/familia">
              Família
            </a>
            .
          </p>
        )}
      </main>
    </RequireAuth>
  );
}
