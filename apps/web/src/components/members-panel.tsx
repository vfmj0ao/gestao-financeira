'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, ApiError } from '@/lib/api';
import type { GroupMember } from '@/lib/types';
import { alertErrorClass, btnGhostClass, btnPrimaryClass, fieldClass, listClass, surfaceClass } from '@/lib/ui';

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Responsável',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Visualizador',
};

type MembersPanelProps = {
  groupId: string;
  permissions: string[];
  currentUserId: string;
  currentRole: string;
};

export function MembersPanel({
  groupId,
  permissions,
  currentUserId,
  currentRole,
}: MembersPanelProps) {
  const { refreshUser } = useAuth();
  const canInvite = permissions.includes('MEMBERS_INVITE');
  const canUpdateRole = permissions.includes('MEMBERS_UPDATE_ROLE');
  const canRemove = permissions.includes('MEMBERS_REMOVE');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void load();
  }, [groupId]);

  async function load() {
    try {
      const data = await apiFetch<GroupMember[]>(`/groups/${groupId}/members`);
      setMembers(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar membros');
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInviteUrl(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{ inviteUrl: string }>(`/groups/${groupId}/invites`, {
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

  async function handleRoleChange(memberUserId: string, role: string) {
    setError(null);
    try {
      await apiFetch(`/groups/${groupId}/members/${memberUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Não foi possível alterar o papel');
    }
  }

  async function handleRemove(memberUserId: string) {
    setError(null);
    try {
      await apiFetch(`/groups/${groupId}/members/${memberUserId}`, { method: 'DELETE' });
      if (memberUserId === currentUserId) {
        await refreshUser();
        return;
      }
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Não foi possível remover');
    }
  }

  function canManage(member: GroupMember) {
    if (member.role === 'OWNER') {
      return false;
    }
    if (currentRole === 'OWNER') {
      return true;
    }
    return member.role !== 'ADMIN';
  }

  return (
    <section aria-labelledby="membros-titulo" className="flex flex-col gap-4">
      <h2 id="membros-titulo" className="text-xl font-semibold">
        Membros
      </h2>
      {error ? (
        <p
          role="alert"
          className={alertErrorClass}
        >
          {error}
        </p>
      ) : null}
      {members.length === 0 ? (
        <p className="text-sm text-muted">Nenhum membro carregado ainda.</p>
      ) : (
        <ul className={listClass}>
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {member.name}
                  {member.id === currentUserId ? ' (você)' : ''}
                </p>
                <p className="text-sm text-muted">{member.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canUpdateRole && canManage(member) ? (
                  <label className="sr-only" htmlFor={`role-${member.id}`}>
                    Papel de {member.name}
                  </label>
                ) : null}
                {canUpdateRole && canManage(member) ? (
                  <select
                    id={`role-${member.id}`}
                    value={member.role}
                    onChange={(event) => void handleRoleChange(member.id, event.target.value)}
                    className={`${fieldClass} py-1.5`}
                  >
                    <option value="VIEWER">Visualizador</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                ) : (
                  <p className="text-sm text-muted">
                    {ROLE_LABEL[member.role] ?? member.role}
                  </p>
                )}
                {(canRemove && canManage(member)) ||
                (member.id === currentUserId && member.role !== 'OWNER') ? (
                  <button
                    type="button"
                    onClick={() => void handleRemove(member.id)}
                    className={btnGhostClass}
                  >
                    {member.id === currentUserId ? 'Sair do grupo' : 'Remover'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canInvite ? (
        <form
          onSubmit={(event) => void handleInvite(event)}
          className={`mt-2 flex max-w-md flex-col gap-4 p-5 ${surfaceClass}`}
        >
          <h3 className="text-lg font-semibold">Convidar membro</h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              className={fieldClass}
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
              className={fieldClass}
            >
              <option value="VIEWER">Visualizador — só consulta</option>
              <option value="EDITOR">Editor — lança e edita</option>
              <option value="ADMIN">Administrador — gerencia membros</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className={btnPrimaryClass}
          >
            {pending ? 'Gerando convite…' : 'Gerar convite'}
          </button>
          {inviteUrl ? (
            <p className="break-all text-sm">
              Link do convite:{' '}
              <a className="underline" href={inviteUrl}>
                {inviteUrl}
              </a>
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
