'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { apiFetch, ApiError } from '@/lib/api';
import { chartNumber, maskMoney, todayISODate } from '@/lib/money';
import type { InvestmentItem, InvestmentSummary } from '@/lib/types';
import { usePreferences } from '@/components/preferences-provider';
import { surfaceClass } from '@/lib/ui';

const PIE_COLORS = [
  '#0f5c56',
  '#3d9a90',
  '#1d4ed8',
  '#a16207',
  '#7e22ce',
  '#be123c',
  '#0f766e',
  '#57534e',
];

function allocationSlices(items: InvestmentItem[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const label = item.ticker ? `${item.name} (${item.ticker})` : item.name;
    const value = chartNumber(item.amount);
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }
    totals.set(label, (totals.get(label) ?? 0) + value);
  }
  const rows = [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
  const maxSlices = 7;
  if (rows.length <= maxSlices) {
    return rows;
  }
  const head = rows.slice(0, maxSlices - 1);
  const rest = rows.slice(maxSlices - 1).reduce((sum, row) => sum + row.value, 0);
  return [...head, { name: 'Outros', value: rest }];
}

type InvestmentsPanelProps = {
  groupId: string;
  permissions: string[];
};

export function InvestmentsPanel({ groupId, permissions }: InvestmentsPanelProps) {
  const { prefs } = usePreferences();
  const canCreate = permissions.includes('INVESTMENTS_CREATE');
  const canUpdate = permissions.includes('INVESTMENTS_UPDATE');
  const canDelete = permissions.includes('INVESTMENTS_DELETE');
  const [items, setItems] = useState<InvestmentItem[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const editing = items.find((item) => item.id === editingId) ?? null;
  const hidden = prefs.hideAmounts;
  const slices = useMemo(() => allocationSlices(items), [items]);
  const sliceTotal = slices.reduce((sum, row) => sum + row.value, 0);

  function formatChartMoney(value: unknown) {
    if (hidden) {
      return 'R$ •••';
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return maskMoney('0.00', false);
    }
    return maskMoney(value.toFixed(2), false);
  }

  useEffect(() => {
    void load();
  }, [groupId]);

  async function load() {
    try {
      const [listData, summaryData] = await Promise.all([
        apiFetch<InvestmentItem[]>(`/groups/${groupId}/investments`),
        apiFetch<InvestmentSummary>(`/groups/${groupId}/investments/summary`),
      ]);
      setItems(listData);
      setSummary(summaryData);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar investimentos');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      ticker: String(data.get('ticker') ?? ''),
      amount: String(data.get('amount') ?? ''),
      quantity: String(data.get('quantity') ?? ''),
      investedOn: String(data.get('investedOn') ?? ''),
    };
    try {
      const path = editingId
        ? `/groups/${groupId}/investments/${editingId}`
        : `/groups/${groupId}/investments`;
      await apiFetch(path, {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      form.reset();
      setEditingId(null);
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof ApiError || saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o investimento',
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiFetch(`/groups/${groupId}/investments/${id}`, { method: 'DELETE' });
      if (editingId === id) {
        setEditingId(null);
      }
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir');
    }
  }

  return (
    <section aria-labelledby="investimentos-titulo" className="flex flex-col gap-6">
      <h2 id="investimentos-titulo" className="sr-only">
        Investimentos
      </h2>
      {slices.length > 0 ? (
        <figure className={`${surfaceClass} p-4 sm:p-5`}>
          <figcaption className="mb-3 text-sm font-medium">Composição</figcaption>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_1fr] lg:items-center">
            <div className="relative mx-auto h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={1}
                    isAnimationActive={false}
                  >
                    {slices.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatChartMoney} />
                </PieChart>
              </ResponsiveContainer>
              <p className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase tracking-wide text-muted">Total</span>
                <span className="text-sm font-semibold tabular-nums">
                  {maskMoney(summary?.total ?? '0.00', hidden)}
                </span>
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {slices.map((row, index) => {
                const percent = sliceTotal > 0 ? Math.round((row.value / sliceTotal) * 100) : 0;
                return (
                  <li key={row.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{row.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {percent}%
                      {hidden ? '' : ` · ${maskMoney(row.value.toFixed(2), false)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </figure>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {canCreate || (canUpdate && editing) ? (
        <form
          key={editingId ?? 'new-investment'}
          onSubmit={(event) => void handleSubmit(event)}
          className="grid gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="inv-name" className="text-sm font-medium">
              Nome
            </label>
            <input
              id="inv-name"
              name="name"
              required
              defaultValue={editing?.name}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="inv-ticker" className="text-sm font-medium">
              Ticker (opcional)
            </label>
            <input
              id="inv-ticker"
              name="ticker"
              defaultValue={editing?.ticker ?? ''}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="inv-amount" className="text-sm font-medium">
              Valor aplicado
            </label>
            <input
              id="inv-amount"
              name="amount"
              inputMode="decimal"
              required
              defaultValue={editing?.amount.replace('.', ',') ?? ''}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="inv-quantity" className="text-sm font-medium">
              Quantidade (opcional)
            </label>
            <input
              id="inv-quantity"
              name="quantity"
              inputMode="decimal"
              defaultValue={editing?.quantity?.replace('.', ',') ?? ''}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="inv-date" className="text-sm font-medium">
              Data da aplicação
            </label>
            <input
              id="inv-date"
              name="investedOn"
              type="date"
              required
              defaultValue={editing?.investedOn ?? todayISODate()}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-foreground px-4 py-2.5 text-background hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Salvando…' : editingId ? 'Salvar alteração' : 'Adicionar investimento'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-md px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum investimento cadastrado.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {item.name}
                  {item.ticker ? ` (${item.ticker})` : ''}
                </p>
                <p className="text-sm text-zinc-500">
                  {item.investedOn.split('-').reverse().join('/')}
                  {item.quantity ? ` · qtd ${item.quantity}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">{maskMoney(item.amount, hidden)}</p>
                {canUpdate ? (
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    className="rounded-md px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    Editar
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    className="rounded-md px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    Excluir
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
