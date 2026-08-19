'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { chartNumber, formatBRL, formatMonthLabel, maskMoney } from '@/lib/money';
import { monthFromChartClick } from '@/lib/chart-click';
import type { GroupReport } from '@/lib/types';
import { usePreferences } from '@/components/preferences-provider';

type ReportsPanelProps = {
  groupId: string;
};

const PERIOD_OPTIONS = [
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
] as const;

const INCOME_COLOR = '#0f766e';
const EXPENSE_COLOR = '#b91c1c';
const BALANCE_COLOR = '#1d4ed8';
const PIE_COLORS = [
  '#b91c1c',
  '#c2410c',
  '#a16207',
  '#15803d',
  '#0f766e',
  '#1d4ed8',
  '#7e22ce',
  '#be185d',
];

export function ReportsPanel({ groupId }: ReportsPanelProps) {
  const { prefs } = usePreferences();
  const [months, setMonths] = useState<'6' | '12' | '24'>('12');
  const [report, setReport] = useState<GroupReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusMonth, setFocusMonth] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await apiFetch<GroupReport>(
          `/groups/${groupId}/reports?months=${months}`,
        );
        setReport(data);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar o relatório',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, months]);

  const monthlyChart = useMemo(
    () =>
      (report?.months ?? []).map((row) => ({
        month: row.month,
        label: formatMonthLabel(row.month),
        receitas: chartNumber(row.income),
        despesas: chartNumber(row.expense),
        acumulado: chartNumber(row.accumulated),
      })),
    [report],
  );

  function formatChartMoney(value: unknown) {
    if (prefs.hideAmounts) {
      return 'R$ •••';
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return formatBRL(value.toFixed(2));
    }
    return formatBRL('0.00');
  }

  function money(amount: string) {
    return maskMoney(amount, prefs.hideAmounts);
  }

  const expensePie = useMemo(
    () =>
      (report?.expenseByCategory ?? []).map((row) => ({
        name: row.name,
        value: chartNumber(row.amount),
      })),
    [report],
  );

  const incomeBars = useMemo(
    () =>
      (report?.incomeByCategory ?? []).map((row) => ({
        name: row.name,
        valor: chartNumber(row.amount),
      })),
    [report],
  );

  const hasCashFlow = monthlyChart.some(
    (row) => row.receitas > 0 || row.despesas > 0,
  );

  function handleExportCsv() {
    if (!report) {
      return;
    }
    const rows: string[][] = [
      ['Mês', 'Receitas', 'Despesas', 'Saldo', 'Saldo acumulado'],
      ...report.months.map((row) => [
        formatMonthLabel(row.month),
        formatBRL(row.income),
        formatBRL(row.expense),
        formatBRL(row.balance),
        formatBRL(row.accumulated),
      ]),
      [],
      ['Totais do período', formatBRL(report.totals.income), formatBRL(report.totals.expense), formatBRL(report.totals.balance), ''],
      [],
      ['Despesas por categoria', 'Valor'],
      ...report.expenseByCategory.map((row) => [row.name, formatBRL(row.amount)]),
      [],
      ['Receitas por categoria', 'Valor'],
      ...report.incomeByCategory.map((row) => [row.name, formatBRL(row.amount)]),
    ];
    if (report.investmentsTotal !== null) {
      rows.push([], ['Total aplicado em investimentos', formatBRL(report.investmentsTotal)]);
    }
    downloadCsv(`relatorio-${report.from}-a-${report.to}.csv`, rows);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-xs flex-col gap-2">
          <label htmlFor="report-period" className="text-sm font-medium">
            Período
          </label>
          <select
            id="report-period"
            value={months}
            onChange={(event) =>
              setMonths(event.target.value as '6' | '12' | '24')
            }
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={!report || loading}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Baixar CSV
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading && !report ? <p>Carregando relatório…</p> : null}

      {report ? (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Entradas" value={money(report.totals.income)} />
            <SummaryCard label="Saídas" value={money(report.totals.expense)} />
            <SummaryCard label="Saldo" value={money(report.totals.balance)} />
            {report.investmentsTotal !== null ? (
              <SummaryCard label="Investido" value={money(report.investmentsTotal)} />
            ) : null}
          </dl>

          {!hasCashFlow ? (
            <p className="text-zinc-500">Sem lançamentos neste período.</p>
          ) : (
            <>
              <figure className="flex flex-col gap-3">
                <figcaption className="text-sm font-medium">Fluxo mensal</figcaption>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyChart}
                      accessibilityLayer
                      onClick={(state) => {
                        const month = monthFromChartClick(state);
                        if (month) {
                          setFocusMonth(month);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" />
                      <XAxis dataKey="label" />
                      <YAxis
                        tickFormatter={(value) => formatChartMoney(value)}
                        width={80}
                        hide={prefs.hideAmounts}
                      />
                      <Tooltip formatter={formatChartMoney} />
                      <Legend />
                      <Bar
                        dataKey="receitas"
                        name="Entradas"
                        fill={INCOME_COLOR}
                        cursor="pointer"
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="despesas"
                        name="Saídas"
                        fill={EXPENSE_COLOR}
                        cursor="pointer"
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </figure>

              <figure className="flex flex-col gap-3">
                <figcaption className="text-sm font-medium">Acumulado</figcaption>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChart} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" />
                      <XAxis dataKey="label" />
                      <YAxis
                        tickFormatter={(value) => formatChartMoney(value)}
                        width={80}
                        hide={prefs.hideAmounts}
                      />
                      <Tooltip formatter={formatChartMoney} />
                      <Line
                        type="monotone"
                        dataKey="acumulado"
                        name="Acumulado"
                        stroke={BALANCE_COLOR}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </figure>

              <div className="grid gap-6 lg:grid-cols-2">
                {expensePie.length > 0 ? (
                  <figure className="flex flex-col gap-3">
                    <figcaption className="text-sm font-medium">Saídas</figcaption>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart accessibilityLayer>
                          <Pie
                            data={expensePie}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            isAnimationActive={false}
                          >
                            {expensePie.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={formatChartMoney} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </figure>
                ) : null}

                {incomeBars.length > 0 ? (
                  <figure className="flex flex-col gap-3">
                    <figcaption className="text-sm font-medium">Entradas</figcaption>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incomeBars} layout="vertical" accessibilityLayer>
                          <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" />
                          <XAxis
                            type="number"
                            hide={prefs.hideAmounts}
                            tickFormatter={(value) => formatChartMoney(value)}
                          />
                          <YAxis type="category" dataKey="name" width={88} />
                          <Tooltip formatter={formatChartMoney} />
                          <Bar
                            dataKey="valor"
                            name="Valor"
                            fill={INCOME_COLOR}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </figure>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <caption className="mb-3 text-left text-sm font-medium">
                    {formatMonthLabel(report.from)} — {formatMonthLabel(report.to)}
                  </caption>
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Mês
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Entradas
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Saídas
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Saldo
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Acumulado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.months.map((row) => (
                      <tr
                        key={row.month}
                        className={`cursor-pointer border-b border-zinc-100 dark:border-zinc-900 ${
                          focusMonth === row.month
                            ? 'bg-zinc-100 dark:bg-zinc-900'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                        }`}
                        onClick={() => setFocusMonth(row.month)}
                      >
                        <th scope="row" className="py-2 pr-3 font-normal">
                          {formatMonthLabel(row.month)}
                        </th>
                        <td className="py-2 pr-3">{money(row.income)}</td>
                        <td className="py-2 pr-3">{money(row.expense)}</td>
                        <td className="py-2 pr-3">{money(row.balance)}</td>
                        <td className="py-2">{money(row.accumulated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {report.expenseByCategory.length > 0 ? (
                <CategoryTable
                  caption="Saídas"
                  rows={report.expenseByCategory}
                  hidden={prefs.hideAmounts}
                />
              ) : null}

              {report.incomeByCategory.length > 0 ? (
                <CategoryTable
                  caption="Entradas"
                  rows={report.incomeByCategory}
                  hidden={prefs.hideAmounts}
                />
              ) : null}
            </>
          )}
        </>
      ) : null}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

function CategoryTable({
  caption,
  rows,
  hidden,
}: {
  caption: string;
  rows: { name: string; amount: string }[];
  hidden: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-xl border-collapse text-left text-sm">
        <caption className="mb-3 text-left text-sm font-medium">{caption}</caption>
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th scope="col" className="py-2 pr-3 font-medium">
              Categoria
            </th>
            <th scope="col" className="py-2 font-medium">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.name}
              className="border-b border-zinc-100 dark:border-zinc-900"
            >
              <th scope="row" className="py-2 pr-3 font-normal">
                {row.name}
              </th>
              <td className="py-2">{maskMoney(row.amount, hidden)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const body = rows
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';'),
    )
    .join('\r\n');
  const blob = new Blob([`\uFEFF${body}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
