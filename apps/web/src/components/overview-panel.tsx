'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { Sparkline } from '@/components/sparkline';
import { TrendBadge } from '@/components/trend-badge';
import { usePreferences } from '@/components/preferences-provider';
import { apiFetch } from '@/lib/api';
import {
  centsToAmount,
  chartNumber,
  currentMonth,
  formatIsoDate,
  formatMonthLabel,
  formatMonthTitle,
  maskMoney,
} from '@/lib/money';
import { amountToCents } from '@/lib/trend';
import { monthFromChartClick } from '@/lib/chart-click';
import type { BudgetMonth, GroupReport, InvestmentSummary, TransactionItem } from '@/lib/types';

const INCOME_COLOR = '#0f766e';
const EXPENSE_COLOR = '#be123c';
const CARD = 'rounded-2xl border border-line bg-card shadow-[0_8px_30px_rgba(28,25,23,0.04)]';

export function OverviewPanel({ groupId }: { groupId: string }) {
  const { prefs, updatePrefs } = usePreferences();
  const [report, setReport] = useState<GroupReport | null>(null);
  const [investments, setInvestments] = useState<InvestmentSummary | null>(null);
  const [monthItems, setMonthItems] = useState<TransactionItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [txFilter, setTxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [overBudgets, setOverBudgets] = useState<{ name: string }[]>([]);

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
        setMonthItems(txData);
        setTxError(null);
      } catch (loadError) {
        setTxError(
          loadError instanceof Error ? loadError.message : 'Não foi possível carregar lançamentos',
        );
      }
      try {
        const budgetData = await apiFetch<BudgetMonth>(
          `/groups/${groupId}/budgets?month=${selectedMonth}`,
        );
        setOverBudgets(
          budgetData.items.filter((item) => item.over).map((item) => ({ name: item.name })),
        );
      } catch {
        setOverBudgets([]);
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

  const categoryRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of monthItems) {
      if (item.type !== 'EXPENSE') {
        continue;
      }
      const name = item.category?.name ?? 'Outros';
      totals.set(name, (totals.get(name) ?? 0) + amountToCents(item.amount));
    }
    return [...totals.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([name, cents]) => ({ name, cents }));
  }, [monthItems]);

  const visibleTx = monthItems
    .filter((item) => txFilter === 'ALL' || item.type === txFilter)
    .slice(0, 6);

  const hidden = prefs.hideAmounts;

  function formatChartMoney(value: unknown) {
    if (hidden) {
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
    return <DashboardSkeleton />;
  }

  const incomeCents = amountToCents(current.income);
  const expenseCents = amountToCents(current.expense);
  const savedRatio =
    incomeCents > 0 ? Math.max(0, Math.min(100, Math.round((amountToCents(current.balance) / incomeCents) * 100))) : null;
  const spentRatio =
    incomeCents > 0 ? Math.min(100, Math.round((expenseCents / incomeCents) * 100)) : null;
  const categoryMax = categoryRows[0]?.cents ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-1 overflow-x-auto pb-1">
          {report.months.map((row) => {
            const selected = row.month === selectedMonth;
            return (
              <button
                key={row.month}
                type="button"
                onClick={() => setSelectedMonth(row.month)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  selected
                    ? 'bg-accent text-accent-fg'
                    : 'bg-line/70 text-muted hover:bg-line'
                }`}
              >
                {formatMonthLabel(row.month)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/lancamentos"
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
          >
            Novo lançamento
          </Link>
          <button
            type="button"
            onClick={() => updatePrefs({ hideAmounts: !hidden })}
            className="rounded-full border border-line px-3 py-1.5 text-xs"
          >
            {hidden ? 'Mostrar' : 'Ocultar'}
          </button>
        </div>
      </div>

      <article className={`${CARD} p-5 sm:p-6`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">{formatMonthTitle(current.month)}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {maskMoney(current.balance, hidden)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-zinc-500">Saldo</span>
              {previous ? (
                <TrendBadge
                  current={current.balance}
                  previous={previous.balance}
                  sense="higher-is-better"
                />
              ) : null}
            </div>
          </div>
          {savedRatio !== null ? (
            <SavedRing percent={savedRatio} hidden={hidden} />
          ) : null}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Entradas {maskMoney(current.income, hidden)}</span>
            <span>Saídas {maskMoney(current.expense, hidden)}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            {incomeCents === 0 && expenseCents === 0 ? (
              <span className="sr-only">Sem movimento</span>
            ) : (
              <>
                <span
                  className="bg-teal-700"
                  style={{
                    width: `${Math.max(8, Math.round((incomeCents / Math.max(incomeCents + expenseCents, 1)) * 100))}%`,
                  }}
                />
                <span
                  className="bg-rose-700"
                  style={{
                    width: `${Math.max(8, Math.round((expenseCents / Math.max(incomeCents + expenseCents, 1)) * 100))}%`,
                  }}
                />
              </>
            )}
          </div>
          {spentRatio !== null ? (
            <p className="mt-2 text-xs text-zinc-500">
              {spentRatio > 100 ? 'Saídas acima das entradas' : `${spentRatio}% das entradas usadas`}
            </p>
          ) : null}
        </div>
      </article>

      {overBudgets.length > 0 ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          Acima do limite: {overBudgets.map((item) => item.name).join(', ')}.{' '}
          <Link className="underline" href="/orcamentos">
            Orçamentos
          </Link>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Entradas"
          value={maskMoney(current.income, hidden)}
          previous={previous?.income}
          currentAmount={current.income}
          sense="higher-is-better"
          series={report.months.map((row) => chartNumber(row.income))}
          stroke={INCOME_COLOR}
        />
        <MetricCard
          label="Saídas"
          value={maskMoney(current.expense, hidden)}
          previous={previous?.expense}
          currentAmount={current.expense}
          sense="lower-is-better"
          series={report.months.map((row) => chartNumber(row.expense))}
          stroke={EXPENSE_COLOR}
        />
        <MetricCard
          label="Investido"
          value={maskMoney(investments?.total ?? '0.00', hidden)}
          href="/investimentos"
        />
      </div>

      <figure className={`${CARD} p-4 sm:p-5`}>
        <figcaption className="mb-3 text-sm font-medium">Fluxo</figcaption>
        <div className="h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyChart}
              accessibilityLayer
              barGap={4}
              onClick={(state) => {
                const month = monthFromChartClick(state);
                if (month) {
                  setSelectedMonth(month);
                }
              }}
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#71717a' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(113,113,122,0.08)' }}
                content={<ChartTooltip formatter={formatChartMoney} />}
              />
              <Bar dataKey="entradas" name="Entradas" cursor="pointer" radius={[8, 8, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                {monthlyChart.map((row) => (
                  <Cell
                    key={`in-${row.month}`}
                    fill={INCOME_COLOR}
                    fillOpacity={row.month === selectedMonth ? 1 : 0.35}
                  />
                ))}
              </Bar>
              <Bar dataKey="saidas" name="Saídas" cursor="pointer" radius={[8, 8, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                {monthlyChart.map((row) => (
                  <Cell
                    key={`out-${row.month}`}
                    fill={EXPENSE_COLOR}
                    fillOpacity={row.month === selectedMonth ? 1 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Saídas do mês</h2>
            <Link className="text-xs text-zinc-500 underline" href="/relatorios">
              Relatórios
            </Link>
          </div>
          {categoryRows.length === 0 ? (
            <EmptyNote href="/lancamentos" label="Registrar saída" />
          ) : (
            <ul className="flex flex-col gap-3">
              {categoryRows.map((row) => (
                <li key={row.name}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{row.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-300">
                      {maskMoney(centsToAmount(row.cents), hidden)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span
                      className="block h-full rounded-full bg-rose-700"
                      style={{ width: `${categoryMax > 0 ? Math.max(6, (row.cents / categoryMax) * 100) : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Atividade</h2>
            <div className="flex items-center gap-1">
              {(['ALL', 'INCOME', 'EXPENSE'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTxFilter(option)}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    txFilter === option
                      ? 'bg-accent text-accent-fg'
                      : 'text-muted hover:bg-line/70'
                  }`}
                >
                  {option === 'ALL' ? 'Tudo' : option === 'INCOME' ? 'Entradas' : 'Saídas'}
                </button>
              ))}
              <Link className="ml-1 text-xs text-zinc-500 underline" href="/lancamentos">
                Ver
              </Link>
            </div>
          </div>
          {txError ? (
            <p role="alert" className="text-sm text-red-700">
              {txError}
            </p>
          ) : visibleTx.length === 0 ? (
            <EmptyNote href="/lancamentos" label="Lançar" />
          ) : (
            <ul className="flex flex-col">
              {visibleTx.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        item.type === 'INCOME' ? 'bg-teal-700' : 'bg-rose-700'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{item.description}</span>
                      <span className="block text-xs text-zinc-500">
                        {formatIsoDate(item.occurredOn)}
                        {item.category ? ` · ${item.category.name}` : ''}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${
                      item.type === 'INCOME'
                        ? 'text-teal-800 dark:text-teal-300'
                        : 'text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {item.type === 'INCOME' ? '+' : '−'}
                    {maskMoney(item.amount, hidden)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
  href,
}: {
  label: string;
  value: string;
  previous?: string;
  currentAmount?: string;
  sense?: 'higher-is-better' | 'lower-is-better';
  series?: number[];
  stroke?: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-zinc-500">{label}</p>
        {previous && currentAmount && sense ? (
          <TrendBadge current={currentAmount} previous={previous} sense={sense} />
        ) : null}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {series && stroke ? (
        <div className="mt-3">
          <Sparkline values={series} stroke={stroke} />
        </div>
      ) : (
        <p className="mt-6 text-xs text-zinc-500">Total acumulado</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${CARD} block p-4 hover:border-accent/40`}>
        {inner}
      </Link>
    );
  }

  return <div className={`${CARD} p-4`}>{inner}</div>;
}

function SavedRing({ percent, hidden }: { percent: number; hidden: boolean }) {
  const radius = 36;
  const stroke = 8;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 96 96" className="-rotate-90" aria-hidden="true">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-zinc-100 dark:text-zinc-800"
          strokeWidth={stroke}
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={INCOME_COLOR}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-semibold tabular-nums">{hidden ? '••' : `${percent}%`}</span>
        <span className="text-[10px] text-zinc-500">guardado</span>
      </p>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter: (value: unknown) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex justify-between gap-6 tabular-nums">
          <span>{entry.name}</span>
          <span>{formatter(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyNote({ href, label }: { href: string; label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
      <Link className="underline" href={href}>
        {label}
      </Link>
    </p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className={`${CARD} h-48 animate-pulse bg-zinc-100 dark:bg-zinc-900`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${CARD} h-28 animate-pulse bg-zinc-100 dark:bg-zinc-900`} />
        <div className={`${CARD} h-28 animate-pulse bg-zinc-100 dark:bg-zinc-900`} />
        <div className={`${CARD} h-28 animate-pulse bg-zinc-100 dark:bg-zinc-900`} />
      </div>
      <div className={`${CARD} h-56 animate-pulse bg-zinc-100 dark:bg-zinc-900`} />
    </div>
  );
}
