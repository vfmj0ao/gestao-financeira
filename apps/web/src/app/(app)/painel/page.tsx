'use client';

import { RequireAuth } from '@/components/require-auth';
import { OverviewPanel } from '@/components/overview-panel';
import { useAuth } from '@/components/auth-provider';

export default function HomeDashboardPage() {
  const { user, activeGroup } = useAuth();

  return (
    <RequireAuth nextPath="/painel">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Olá{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        {activeGroup ? (
          <OverviewPanel key={activeGroup.id} groupId={activeGroup.id} />
        ) : (
          <p>
            Crie um grupo em{' '}
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
