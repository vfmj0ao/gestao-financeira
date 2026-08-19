'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { describeChange, financialInsight } from '@/lib/month-compare';
import { currentMonth, formatBRL, formatMonthLabel } from '@/lib/money';
import type { GroupReport, InvestmentSummary, TransactionItem } from '@/lib/types';

export function OverviewPanel({ groupId }: { groupId: string }) {
  const [report, setReport] = useState<GroupReport | null>(null);
  const [investments, setInvestments] = useState<InvestmentSummary | null>(null);
  const [recent, setRecent] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [reportData, investmentData, txData] = await Promise.all([
          apiFetch<GroupReport>(`/groups/${groupId}/reports?months=6`),
          apiFetch<InvestmentSummary>(`/groups/${groupId}/investments/summary`),
          apiFetch<TransactionItem[]>(
            `/groups/${groupId}/transactions?month=${currentMonth()}`,
          ),
        ]);
        setReport(reportData);
        setInvestments(investmentData);
        setRecent(txData.slice(0, 5));
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar o resumo',
        );
      }
    })();
  }, [groupId]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!report) {
    return <p>Carregando resumo…</p>;
  }

  const current = report.months[report.months.length - 1];
  const previous = report.months[report.months.length - 2];
  if (!current || !previous) {
    return <p>Ainda não há meses suficientes para o panorama.</p>;
  }

  const insight = financialInsight({
    currentMonth: current.month,
    previousMonth: previous.month,
    currentIncome: current.income,
    previousIncome: previous.income,
    currentExpense: current.expense,
    previousExpense: previous.expense,
    currentBalance: current.balance,
    previousBalance: previous.balance,
  });

  return (
    <div className="flex flex-col gap-8">
      <p className="rounded-xl border border-zinc-200 bg-[var(--card)] p-4 text-sm leading-6 dark:border-zinc-800">
        {insight}
      </p>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={`Entradas · ${formatMonthLabel(current.month)}`}
          value={formatBRL(current.income)}
          hint={describeChange(current.income, previous.income)}
        />
        <SummaryCard
          label={`Saídas · ${formatMonthLabel(current.month)}`}
          value={formatBRL(current.expense)}
          hint={describeChange(current.expense, previous.expense)}
        />
        <SummaryCard
          label="O que sobrou"
          value={formatBRL(current.balance)}
          hint={describeChange(current.balance, previous.balance)}
        />
        <SummaryCard
          label="Investimentos aplicados"
          value={formatBRL(investments?.total ?? '0.00')}
          hint="Total já aplicado, não o mês"
        />
      </dl>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Últimos lançamentos deste mês</h2>
          <Link className="text-sm underline" href="/lancamentos">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum lançamento neste mês.{' '}
            <Link className="underline" href="/lancamentos">
              Registrar entrada ou saída
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {recent.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {item.description}
                  <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
                    {item.occurredOn} · {item.category?.name ?? 'Sem categoria'}
                  </span>
                </span>
                <span className={item.type === 'INCOME' ? 'text-teal-800 dark:text-teal-300' : ''}>
                  {item.type === 'INCOME' ? '+' : '−'}
                  {formatBRL(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm">
        Cartão de crédito e imposto de renda entram em telas próprias depois, com dados reais.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-[var(--card)] p-4 dark:border-zinc-800">
      <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{hint}</p>
    </div>
  );
}
