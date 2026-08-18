'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, ApiError } from '@/lib/api';
import type { InvitePreview } from '@/lib/types';

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { user, loading } = useAuth();
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(token ? null : 'Convite inválido');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    void (async () => {
      try {
        const data = await apiFetch<InvitePreview>(`/invites/${token}`);
        setPreview(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Convite inválido');
      }
    })();
  }, [token]);

  async function accept() {
    setPending(true);
    setError(null);
    try {
      await apiFetch('/invites/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      router.push('/painel');
    } catch (acceptError) {
      setError(
        acceptError instanceof ApiError || acceptError instanceof Error
          ? acceptError.message
          : 'Não foi possível aceitar o convite',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-6 py-12"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Convite para o grupo</h1>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
      {preview ? (
        <>
          <p>
            Você foi convidado para <strong>{preview.groupName}</strong> como{' '}
            <strong>
              {preview.role === 'ADMIN'
                ? 'administrador'
                : preview.role === 'EDITOR'
                  ? 'editor'
                  : 'visualizador'}
            </strong>
            .
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use o e-mail {preview.email} para entrar.
          </p>
          {loading ? (
            <p>Verificando sua sessão…</p>
          ) : user ? (
            <button
              type="button"
              onClick={() => void accept()}
              disabled={pending}
              className="w-fit rounded-md bg-foreground px-4 py-2.5 text-background hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Entrando…' : 'Aceitar convite'}
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-foreground px-4 py-2.5 text-background hover:opacity-90"
                href={`/cadastro?token=${encodeURIComponent(token)}&email=${encodeURIComponent(preview.email)}`}
              >
                Criar conta e entrar
              </Link>
              <Link
                className="rounded-md border border-zinc-300 px-4 py-2.5 hover:bg-zinc-50 dark:border-zinc-700"
                href={`/entrar?next=${encodeURIComponent(`/convite?token=${token}`)}`}
              >
                Já tenho conta
              </Link>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<p className="px-6 py-12">Carregando convite…</p>}>
      <InviteContent />
    </Suspense>
  );
}
