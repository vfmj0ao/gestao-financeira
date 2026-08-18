import Link from 'next/link';

export default function Home() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16"
    >
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Finanças da família, com clareza e controle.
      </h1>
      <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Crie sua conta, convide pessoas da família e defina o que cada uma pode ver ou alterar.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-md bg-foreground px-5 py-2.5 text-background hover:opacity-90"
          href="/cadastro"
        >
          Criar conta
        </Link>
        <Link
          className="rounded-md border border-zinc-300 px-5 py-2.5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          href="/entrar"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
