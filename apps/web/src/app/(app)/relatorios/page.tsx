'use client';

import { RequireAuth } from '@/components/require-auth';
import { ReportsPanel } from '@/components/reports-panel';
import { useAuth } from '@/components/auth-provider';

export default function ReportsPage() {
  const { activeGroup } = useAuth();

  return (
    <RequireAuth nextPath="/relatorios">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Relatórios</h1>
        {activeGroup ? (
          <ReportsPanel key={activeGroup.id} groupId={activeGroup.id} />
        ) : (
          <p>Escolha um grupo no topo.</p>
        )}
      </main>
    </RequireAuth>
  );
}
