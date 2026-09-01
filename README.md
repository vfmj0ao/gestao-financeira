# Gestão financeira familiar

App para orçamentos, lançamentos, investimentos e relatórios em grupo familiar.

O repositório tem **somente o código**. Não há CPF, e-mails reais, senhas de produção nem extratos. Dados de uso ficam no banco em produção (variáveis de ambiente na Vercel/Railway), fora do Git.

## Demo

[gestao-financeira-orcin-omega.vercel.app](https://gestao-financeira-orcin-omega.vercel.app)

## Stack

- Web: Next.js, TypeScript, Tailwind
- API: NestJS, Prisma, PostgreSQL
- Auth: JWT + cookie de refresh, senhas com argon2

## Como executar

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm db:up
pnpm --filter @gestao-financeira/api exec prisma migrate deploy
pnpm dev
```

- Site: `http://localhost:3000`
- API: `http://localhost:3001/api/health`

Troque `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` antes de qualquer deploy.

## Licença

MIT
