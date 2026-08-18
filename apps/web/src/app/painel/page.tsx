'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { InvestmentsPanel } from '@/components/investments-panel';
import { MembersPanel } from '@/components/members-panel';
import { TransactionsPanel } from '@/components/transactions-panel';
import { apiFetch, ApiError } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading, activeGroup, setActiveGroupId, refreshUser } = useAuth();
  const router = useRouter();
  const [groupError, setGroupError] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/entrar?next=/painel');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main id="conteudo-principal" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p>Carregando painel…</p>
      </main>
    );
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingGroup(true);
    setGroupError(null);
    const form = event.currentTarget;
    try {
      const created = await apiFetch<{ id: string }>(`/groups`, {
        method: 'POST',
        body: JSON.stringify({ name: String(new FormData(form).get('name') ?? '') }),
      });
      form.reset();
      await refreshUser();
      setActiveGroupId(created.id);
    } catch (createError) {
      setGroupError(
        createError instanceof ApiError || createError instanceof Error
          ? createError.message
          : 'Não foi possível criar o grupo',
      );
    } finally {
      setCreatingGroup(false);
    }
  }

  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12"
    >
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {user.name}</h1>
        {user.groups.length > 0 ? (
          <div className="flex flex-col gap-2 max-w-md">
            <label htmlFor="active-group" className="text-sm font-medium">
              Grupo ativo
            </label>
            <select
              id="active-group"
              value={activeGroup?.id ?? ''}
              onChange={(event) => setActiveGroupId(event.target.value)}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            >
              {user.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.role === 'OWNER' ? 'responsável' : group.role.toLowerCase()})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">Você ainda não participa de um grupo.</p>
        )}
        <form
          onSubmit={(event) => void handleCreateGroup(event)}
          className="flex max-w-md flex-col gap-2"
        >
          <label htmlFor="new-group-name" className="text-sm font-medium">
            Novo grupo
          </label>
          <div className="flex gap-2">
            <input
              id="new-group-name"
              name="name"
              required
              minLength={2}
              placeholder="Ex.: Família, Pessoal"
              className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
            <button
              type="submit"
              disabled={creatingGroup}
              className="rounded-md bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:opacity-60"
            >
              Criar
            </button>
          </div>
        </form>
        {groupError ? (
          <p role="alert" className="text-sm text-red-700">
            {groupError}
          </p>
        ) : null}
      </section>

      {activeGroup ? (
        <>
          <p>
            <Link className="underline" href="/relatorios">
              Ver gráficos e relatórios
            </Link>
          </p>
          <TransactionsPanel
            key={`${activeGroup.id}-tx`}
            groupId={activeGroup.id}
            permissions={activeGroup.permissions}
          />
          <InvestmentsPanel
            key={`${activeGroup.id}-inv`}
            groupId={activeGroup.id}
            permissions={activeGroup.permissions}
          />
          <MembersPanel
            key={`${activeGroup.id}-members`}
            groupId={activeGroup.id}
            permissions={activeGroup.permissions}
            currentUserId={user.id}
            currentRole={activeGroup.role}
          />
        </>
      ) : null}
    </main>
  );
}
