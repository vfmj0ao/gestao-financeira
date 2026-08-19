'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthForm } from '@/components/auth-form';
import { useAuth } from '@/components/auth-provider';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const inviteToken = searchParams.get('token') ?? undefined;
  const email = searchParams.get('email') ?? undefined;

  return (
    <AuthForm
      title={inviteToken ? 'Criar conta para entrar no grupo' : 'Criar conta'}
      submitLabel="Criar conta"
      pending={pending}
      fields={[
        { name: 'name', label: 'Nome', autoComplete: 'name' },
        {
          name: 'email',
          label: 'E-mail',
          type: 'email',
          autoComplete: 'email',
          defaultValue: email,
        },
        { name: 'password', label: 'Senha', type: 'password', autoComplete: 'new-password' },
      ]}
      onSubmit={async (form) => {
        setPending(true);
        try {
          await register({
            name: String(form.get('name') ?? ''),
            email: String(form.get('email') ?? ''),
            password: String(form.get('password') ?? ''),
            inviteToken,
          });
          router.push('/painel');
        } finally {
          setPending(false);
        }
      }}
    />
  );
}

export default function RegisterPage() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12"
    >
      <Suspense fallback={<p>Carregando formulário…</p>}>
        <RegisterForm />
      </Suspense>
      <p className="mt-4 text-sm text-muted">
        A senha precisa ter no mínimo 8 caracteres, com letras e números.
      </p>
      <p className="mt-6 text-sm text-muted">
        Já tem conta?{' '}
        <Link className="underline" href="/entrar">
          Entrar
        </Link>
      </p>
    </main>
  );
}
