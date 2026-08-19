'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthForm } from '@/components/auth-form';
import { useAuth } from '@/components/auth-provider';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const nextPath = searchParams.get('next') ?? '/painel';

  return (
    <AuthForm
      title="Entrar"
      submitLabel="Entrar"
      pending={pending}
      fields={[
        { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' },
        { name: 'password', label: 'Senha', type: 'password', autoComplete: 'current-password' },
      ]}
      onSubmit={async (form) => {
        setPending(true);
        try {
          await login(String(form.get('email') ?? ''), String(form.get('password') ?? ''));
          router.push(nextPath);
        } finally {
          setPending(false);
        }
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12"
    >
      <Suspense fallback={<p>Carregando formulário…</p>}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-sm text-muted">
        Ainda não tem conta?{' '}
        <Link className="underline" href="/cadastro">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
