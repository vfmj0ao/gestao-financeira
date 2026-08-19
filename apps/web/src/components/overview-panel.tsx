'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Sparkline } from '@/components/sparkline';
import { TrendBadge } from '@/components/trend-badge';
import { usePreferences } from '@/components/preferences-provider';
import { apiFetch } from '@/lib/api';
import { chartNumber, currentMonth, formatMonthLabel, maskMoney } from '@/lib/money';
import type { GroupReport, InvestmentSummary, TransactionItem } from '@/lib/types';

const INCOME_COLOR = '#0f766e';
const EXPENSE_COLOR = '#b91c1c';
const BALANCE_COLOR = '#1d4ed8';
const PIE_COLORS = ['#b91c1c', '#c2410c', '#a16207', '#15803d', '#0f766e', '#1d4ed8', '#7e22ce'];

export function OverviewPanel({ groupId }: { groupId: string }) {
  const { prefs, updatePrefs } = usePreferences();
  const [report, setReport] = useState<GroupReport | null>(null);
  const [investments, setInvestments] = useState<InvestmentSummary | null>(null);
  const [recent, setRecent] = useState<TransactionItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [txFilter, setTxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [reportData, investmentData] = await Promise.all([
          apiFetch<GroupReport>(`/groups/${groupId}/reports?months=6`),
          apiFetch<InvestmentSummary>(`/groups/${groupId}/investments/summary`),
        ]);
        setReport(reportData);
        setInvestments(investmentData);
        const latest = reportData.months[reportData.months.length - 1]?.month ?? currentMonth();
        setSelectedMonth((current) =>
          reportData.months.some((row) => row.month === current) ? current : latest,
        );
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o resumo');
      }
    })();
  }, [groupId]);

  useEffect(() => {
    if (!selectedMonth) {
      return;
    }
    void (async () => {
      try {
        const txData = await apiFetch<TransactionItem[]>(
          `/groups/${groupId}/transactions?month=${selectedMonth}`,
        );
        setRecent(txData.slice(0, 8));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar lançamentos');
      }
    })();
  }, [groupId, selectedMonth]);

  const current = report?.months.find((row) => row.month === selectedMonth);
  const currentIndex = report?.months.findIndex((row) => row.month === selectedMonth) ?? -1;
  const previous = currentIndex > 0 ? report?.months[currentIndex - 1] : undefined;

  const monthlyChart = useMemo(
    () =>
      (report?.months ?? []).map((row) => ({
        month: row.month,
        label: formatMonthLabel(row.month),
        entradas: chartNumber(row.income),
        saidas: chartNumber(row.expense),
      })),
    [report],
  );

  const categoryBars = useMemo(
    () =>
      (report?.expenseByCategory ?? []).slice(0, 6).map((row) => ({
        name: row.name,
        valor: chartNumber(row.amount),
      })),
    [report],
  );

  const visibleTx = recent.filter((item) => txFilter === 'ALL' || item.type === txFilter);

  function formatChartMoney(value: unknown) {
    if (prefs.hideAmounts) {
      return 'R$ •••';
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return maskMoney('0.00', false);
    }
    return maskMoney(value.toFixed(2), false);
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!report || !current) {
    return <p>Carregando…</p>;
  }

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < report.months.length - 1;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => {
              const prev = report.months[currentIndex - 1];
              if (prev) {
                setSelectedMonth(prev.month);
              }
            }}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <p className="min-w-[6.5rem] text-center text-sm font-semibold">
            {formatMonthLabel(current.month)}
          </p>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => {
              const next = report.months[currentIndex + 1];
              if (next) {
                setSelectedMonth(next.month);
              }
            }}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => updatePrefs({ hideAmounts: !prefs.hideAmounts })}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
        >
          {prefs.hideAmounts ? 'Mostrar valores' : 'Ocultar valores'}
        </button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Entradas"
          value={maskMoney(current.income, prefs.hideAmounts)}
          previous={previous?.income}
          currentAmount={current.income}
          sense="higher-is-better"
          series={report.months.map((row) => chartNumber(row.income))}
          stroke={INCOME_COLOR}
        />
        <MetricCard
          label="Saídas"
          value={maskMoney(current.expense, prefs.hideAmounts)}
          previous={previous?.expense}
          currentAmount={current.expense}
          sense="lower-is-better"
          series={report.months.map((row) => chartNumber(row.expense))}
          stroke={EXPENSE_COLOR}
        />
        <MetricCard
          label="Saldo"
          value={maskMoney(current.balance, prefs.hideAmounts)}
          previous={previous?.balance}
          currentAmount={current.balance}
          sense="higher-is-better"
          series={report.months.map((row) => chartNumber(row.balance))}
          stroke={BALANCE_COLOR}
        />
        <div className="rounded-xl border border-zinc-200 bg-[var(--card)] p-4 dark:border-zinc-800">
          <dt className="text-sm text-zinc-600 dark:text-zinc-400">Investido</dt>
          <dd className="mt-1 text-xl font-semibold">
            {maskMoney(investments?.total ?? '0.00', prefs.hideAmounts)}
          </dd>
          <p className="mt-3 text-xs text-zinc-500">Total acumulado</p>
        </div>
      </dl>

      <div className="grid gap-6 lg:grid-cols-5">
        <figure className="lg:col-span-3 flex flex-col gap-3">
          <figcaption className="text-sm font-medium">Fluxo (6 meses)</figcaption>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyChart}
                accessibilityLayer
                onClick={(state) => {
                  const month = state?.activePayload?.[0]?.payload?.month as string | undefined;
                  if (month) {
                    setSelectedMonth(month);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => formatChartMoney(value)} width={72} hide={prefs.hideAmounts} />
                <Tooltip formatter={formatChartMoney} />
                <Bar dataKey="entradas" name="Entradas" fill={INCOME_COLOR} cursor="pointer" isAnimationActive={false} />
                <Bar dataKey="saidas" name="Saídas" fill={EXPENSE_COLOR} cursor="pointer" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>

        <figure className="lg:col-span-2 flex flex-col gap-3">
          <figcaption className="text-sm font-medium">Saídas por categoria</figcaption>
          {categoryBars.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem saídas no período.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBars} layout="vertical" accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" />
                  <XAxis type="number" hide={prefs.hideAmounts} tickFormatter={(value) => formatChartMoney(value)} />
                  <YAxis type="category" dataKey="name" width={88} />
                  <Tooltip formatter={formatChartMoney} />
                  <Bar dataKey="valor" name="Valor" isAnimationActive={false}>
                    {categoryBars.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </figure>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Lançamentos</h2>
          <div className="flex items-center gap-2">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTxFilter(option)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  txFilter === option
                    ? 'bg-foreground text-background'
                    : 'border border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {option === 'ALL' ? 'Todos' : option === 'INCOME' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
            <Link className="text-sm underline" href="/lancamentos">
              Abrir
            </Link>
          </div>
        </div>
        {visibleTx.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nada neste filtro.{' '}
            <Link className="underline" href="/lancamentos">
              Lançar
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {visibleTx.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {item.description}
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {item.occurredOn} · {item.category?.name ?? '—'}
                  </span>
                </span>
                <span
                  className={
                    item.type === 'INCOME'
                      ? 'font-medium text-emerald-700 dark:text-emerald-400'
                      : 'font-medium text-red-700 dark:text-red-400'
                  }
                >
                  {item.type === 'INCOME' ? '+' : '−'}
                  {maskMoney(item.amount, prefs.hideAmounts)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  previous,
  currentAmount,
  sense,
  series,
  stroke,
}: {
  label: string;
  value: string;
  previous: string | undefined;
  currentAmount: string;
  sense: 'higher-is-better' | 'lower-is-better';
  series: number[];
  stroke: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-[var(--card)] p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
        {previous ? (
          <TrendBadge current={currentAmount} previous={previous} sense={sense} />
        ) : (
          <span className="text-sm text-zinc-400">—</span>
        )}
      </div>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
      <div className="mt-3">
        <Sparkline values={series} stroke={stroke} />
      </div>
    </div>
  );
}
