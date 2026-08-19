'use client';

import { RequireAuth } from '@/components/require-auth';
import { OverviewPanel } from '@/components/overview-panel';
import { useAuth } from '@/components/auth-provider';

export default function HomeDashboardPage() {
  const { user, activeGroup } = useAuth();

  return (
    <RequireAuth nextPath="/painel">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">
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
