'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, ApiError } from '@/lib/api';
import type { AuthUser } from '@/lib/types';
import { alertErrorClass, btnGhostClass, btnPrimaryClass, fieldClass } from '@/lib/ui';

export function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameOk, setNameOk] = useState(false);
  const [namePending, setNamePending] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsOk, setSessionsOk] = useState(false);
  const [sessionsPending, setSessionsPending] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  if (!user) {
    return null;
  }

  async function handleName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNamePending(true);
    setNameError(null);
    setNameOk(false);
    try {
      const updated = await apiFetch<AuthUser>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      await refreshUser();
      setName(updated.name);
      setNameOk(true);
    } catch (saveError) {
      setNameError(
        saveError instanceof ApiError || saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o nome',
      );
    } finally {
      setNamePending(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordError(null);
    setPasswordOk(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiFetch('/auth/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: String(data.get('currentPassword') ?? ''),
          newPassword: String(data.get('newPassword') ?? ''),
        }),
      });
      form.reset();
      setPasswordOk(true);
    } catch (saveError) {
      setPasswordError(
        saveError instanceof ApiError || saveError instanceof Error
          ? saveError.message
          : 'Não foi possível alterar a senha',
      );
    } finally {
      setPasswordPending(false);
    }
  }

  async function handleLogoutOthers() {
    setSessionsPending(true);
    setSessionsError(null);
    setSessionsOk(false);
    try {
      await apiFetch('/auth/logout-others', { method: 'POST' });
      setSessionsOk(true);
    } catch (saveError) {
      setSessionsError(
        saveError instanceof ApiError || saveError instanceof Error
          ? saveError.message
          : 'Não foi possível encerrar as outras sessões',
      );
    } finally {
      setSessionsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-medium">Conta</h2>
        <p className="mt-1 text-sm text-muted">Este aparelho. O e-mail não muda por aqui.</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">E-mail</p>
        <p className="text-sm">{user.email}</p>
      </div>

      <form onSubmit={(event) => void handleName(event)} className="flex max-w-md flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="account-name" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="account-name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </div>
        {nameError ? (
          <p role="alert" className={alertErrorClass}>
            {nameError}
          </p>
        ) : null}
        {nameOk ? <p className="text-sm text-income">Nome atualizado.</p> : null}
        <button type="submit" disabled={namePending} className={`w-fit ${btnPrimaryClass}`}>
          {namePending ? 'Salvando…' : 'Salvar nome'}
        </button>
      </form>

      <form onSubmit={(event) => void handlePassword(event)} className="flex max-w-md flex-col gap-3">
        <p className="text-sm font-medium">Senha</p>
        <p className="text-sm text-muted">Mínimo 8 caracteres, com letras e números. A sessão neste aparelho continua.</p>
        <div className="flex flex-col gap-2">
          <label htmlFor="current-password" className="text-sm font-medium">
            Senha atual
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="new-password" className="text-sm font-medium">
            Nova senha
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            className={fieldClass}
          />
        </div>
        {passwordError ? (
          <p role="alert" className={alertErrorClass}>
            {passwordError}
          </p>
        ) : null}
        {passwordOk ? <p className="text-sm text-income">Senha alterada. Outras sessões foram encerradas.</p> : null}
        <button type="submit" disabled={passwordPending} className={`w-fit ${btnPrimaryClass}`}>
          {passwordPending ? 'Salvando…' : 'Alterar senha'}
        </button>
      </form>

      <div className="flex max-w-md flex-col gap-3">
        <p className="text-sm font-medium">Sessões</p>
        <p className="text-sm text-muted">
          Encerra o acesso em outros navegadores e aparelhos. Você permanece neste.
        </p>
        {sessionsError ? (
          <p role="alert" className={alertErrorClass}>
            {sessionsError}
          </p>
        ) : null}
        {sessionsOk ? <p className="text-sm text-income">Outras sessões encerradas.</p> : null}
        <button
          type="button"
          disabled={sessionsPending}
          onClick={() => void handleLogoutOthers()}
          className={`w-fit border border-line ${btnGhostClass}`}
        >
          {sessionsPending ? 'Encerrando…' : 'Encerrar outras sessões'}
        </button>
      </div>
    </div>
  );
}
