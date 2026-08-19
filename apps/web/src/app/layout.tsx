import type { Metadata } from 'next';
import { Fraunces, Geist_Mono, Outfit } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { ThemeScript } from '@/components/theme-script';
import { Providers } from './providers';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gestão Financeira',
  description:
    'Acompanhe entradas, saídas e investimentos em família, com segurança e acessibilidade.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${outfit.variable} ${fraunces.variable} ${geistMono.variable} min-h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <ThemeScript />
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          Pular para o conteúdo
        </a>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
