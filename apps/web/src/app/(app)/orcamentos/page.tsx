'use client';

import { RequireAuth } from '@/components/require-auth';
import { BudgetsPanel } from '@/components/budgets-panel';
import { useAuth } from '@/components/auth-provider';

export default function BudgetsPage() {
  const { activeGroup } = useAuth();

  return (
    <RequireAuth nextPath="/orcamentos">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
        <h1 className="text-3xl tracking-tight">Orçamentos</h1>
        {activeGroup ? (
          <BudgetsPanel
            key={activeGroup.id}
            groupId={activeGroup.id}
            permissions={activeGroup.permissions}
          />
        ) : (
          <p>Crie um grupo em Família.</p>
        )}
      </main>
    </RequireAuth>
  );
}
