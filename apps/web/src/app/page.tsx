export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <p className="text-sm font-semibold tracking-tight">Gestão Financeira</p>
      </header>
      <main
        id="conteudo-principal"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16"
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Finanças da família, com clareza e controle.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Em breve você poderá acompanhar entradas, saídas e investimentos, convidar membros da
          família e definir o que cada pessoa pode fazer.
        </p>
        <p className="text-sm text-zinc-500">
          A base do projeto já está pronta: login, grupos e permissões vêm a seguir.
        </p>
      </main>
    </div>
  );
}
