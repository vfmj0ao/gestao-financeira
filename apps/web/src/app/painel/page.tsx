'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, ApiError } from '@/lib/api';
import type { GroupMember } from '@/lib/types';
import { TransactionsPanel } from '@/components/transactions-panel';

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Responsável',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Visualizador',
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const group = user?.groups[0];
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/entrar?next=/painel');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!group) {
      return;
    }
    void (async () => {
      try {
        const data = await apiFetch<GroupMember[]>(`/groups/${group.id}/members`);
        setMembers(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar membros');
      }
    })();
  }, [group]);

  if (loading || !user) {
    return (
      <main id="conteudo-principal" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p>Carregando painel…</p>
      </main>
    );
  }

  const canInvite = group?.permissions.includes('MEMBERS_INVITE') ?? false;

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group) {
      return;
    }
    setError(null);
    setInviteUrl(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{ inviteUrl: string }>(`/groups/${group.id}/invites`, {
        method: 'POST',
        body: JSON.stringify({
          email: String(form.get('email') ?? ''),
          role: String(form.get('role') ?? 'VIEWER'),
        }),
      });
      setInviteUrl(result.inviteUrl);
      event.currentTarget.reset();
    } catch (inviteError) {
      setError(
        inviteError instanceof ApiError || inviteError instanceof Error
          ? inviteError.message
          : 'Não foi possível criar o convite',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12"
    >
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {user.name}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {group ? `Grupo: ${group.name}` : 'Você ainda não participa de um grupo.'}
        </p>
      </section>

      {group ? <TransactionsPanel groupId={group.id} permissions={group.permissions} /> : null}

      <section aria-labelledby="membros-titulo" className="flex flex-col gap-4">
        <h2 id="membros-titulo" className="text-xl font-semibold">
          Membros
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum membro carregado ainda.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-zinc-500">{member.email}</p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {ROLE_LABEL[member.role] ?? member.role}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canInvite && group ? (
        <section aria-labelledby="convite-titulo" className="max-w-md">
          <h2 id="convite-titulo" className="text-xl font-semibold">
            Convidar membro
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            A pessoa precisa criar o próprio login. Você define o que ela pode fazer.
          </p>
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </p>
          ) : null}
          <form onSubmit={(event) => void handleInvite(event)} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="invite-email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                required
                className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Permissão
              </label>
              <select
                id="invite-role"
                name="role"
                defaultValue="VIEWER"
                className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
              >
                <option value="VIEWER">Visualizador — só consulta</option>
                <option value="EDITOR">Editor — lança e edita</option>
                <option value="ADMIN">Administrador — gerencia membros</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-foreground px-4 py-2.5 text-background hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Gerando convite…' : 'Gerar convite'}
            </button>
          </form>
          {inviteUrl ? (
            <p className="mt-4 break-all text-sm">
              Link do convite:{' '}
              <a className="underline" href={inviteUrl}>
                {inviteUrl}
              </a>
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
