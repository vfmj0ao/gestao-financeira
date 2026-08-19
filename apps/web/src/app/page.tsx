import Link from 'next/link';
import { btnGhostClass, btnPrimaryClass, surfaceClass } from '@/lib/ui';

export default function Home() {
  return (
    <main id="conteudo-principal" className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-medium text-accent">Para a casa toda</p>
          <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">
            O dinheiro da família, com clareza.
          </h1>
          <p className="max-w-md text-lg text-muted">
            Entradas, saídas e o que cada pessoa pode ver ou alterar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className={btnPrimaryClass} href="/cadastro">
              Criar conta
            </Link>
            <Link className={`${btnGhostClass} border border-line`} href="/entrar">
              Entrar
            </Link>
          </div>
        </div>

        <ul className={`${surfaceClass} grid gap-0 overflow-hidden`}>
          {[
            { title: 'Início', text: 'Saldo do mês e o rumo das contas.' },
            { title: 'Lançamentos', text: 'Registre o dia a dia sem planilha.' },
            { title: 'Família', text: 'Convide e defina papéis.' },
          ].map((item) => (
            <li key={item.title} className="border-b border-line px-5 py-4 last:border-0">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
