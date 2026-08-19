'use client';

import { RequireAuth } from '@/components/require-auth';
import { InvestmentsPanel } from '@/components/investments-panel';
import { useAuth } from '@/components/auth-provider';

export default function InvestmentsPage() {
  const { activeGroup } = useAuth();

  return (
    <RequireAuth nextPath="/investimentos">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
        <h1 className="text-3xl tracking-tight">Investimentos</h1>
        {activeGroup ? (
          <InvestmentsPanel
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
