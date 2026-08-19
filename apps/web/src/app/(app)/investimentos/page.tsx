'use client';

import { RequireAuth } from '@/components/require-auth';
import { InvestmentsPanel } from '@/components/investments-panel';
import { useAuth } from '@/components/auth-provider';

export default function InvestmentsPage() {
  const { activeGroup } = useAuth();

  return (
    <RequireAuth nextPath="/investimentos">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Investimentos</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Acompanhe o que o grupo já aplicou.
          </p>
        </div>
        {activeGroup ? (
          <InvestmentsPanel
            key={activeGroup.id}
            groupId={activeGroup.id}
            permissions={activeGroup.permissions}
          />
        ) : (
          <p>Escolha ou crie um grupo em Família para ver investimentos.</p>
        )}
      </main>
    </RequireAuth>
  );
}
