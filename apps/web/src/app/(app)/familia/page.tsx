'use client';

import { RequireAuth } from '@/components/require-auth';
import { MembersPanel } from '@/components/members-panel';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, ApiError } from '@/lib/api';
import { useState, type FormEvent } from 'react';

export default function FamilyPage() {
  const { user, activeGroup, setActiveGroupId, refreshUser } = useAuth();
  const [groupError, setGroupError] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

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
    <RequireAuth nextPath="/familia">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Família</h1>

        <form onSubmit={(event) => void handleCreateGroup(event)} className="flex max-w-md flex-col gap-2">
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
              className="flex-1 rounded-lg border border-zinc-300 bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
            />
            <button
              type="submit"
              disabled={creatingGroup}
              className="rounded-lg bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:opacity-60"
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

        {user && activeGroup ? (
          <MembersPanel
            key={activeGroup.id}
            groupId={activeGroup.id}
            permissions={activeGroup.permissions}
            currentUserId={user.id}
            currentRole={activeGroup.role}
          />
        ) : (
          <p>Crie um grupo para convidar pessoas.</p>
        )}
      </main>
    </RequireAuth>
  );
}
