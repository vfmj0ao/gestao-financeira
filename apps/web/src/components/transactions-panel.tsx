'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { currentMonth, formatBRL, todayISODate } from '@/lib/money';
import type { Category, MonthSummary, TransactionItem } from '@/lib/types';

type TransactionsPanelProps = {
  groupId: string;
  permissions: string[];
};

export function TransactionsPanel({ groupId, permissions }: TransactionsPanelProps) {
  const canCreate = permissions.includes('TRANSACTIONS_CREATE');
  const canDelete = permissions.includes('TRANSACTIONS_DELETE');
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  useEffect(() => {
    void (async () => {
      try {
        const [summaryData, listData, categoryData] = await Promise.all([
          apiFetch<MonthSummary>(`/groups/${groupId}/summary?month=${month}`),
          apiFetch<TransactionItem[]>(`/groups/${groupId}/transactions?month=${month}`),
          apiFetch<Category[]>(`/groups/${groupId}/categories`),
        ]);
        setSummary(summaryData);
        setItems(listData);
        setCategories(categoryData);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar lançamentos');
      }
    })();
  }, [groupId, month]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiFetch<TransactionItem>(`/groups/${groupId}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          amount: String(data.get('amount') ?? ''),
          description: String(data.get('description') ?? ''),
          occurredOn: String(data.get('occurredOn') ?? ''),
          categoryId: String(data.get('categoryId') ?? ''),
        }),
      });
      form.reset();
      const [listData, summaryData] = await Promise.all([
        apiFetch<TransactionItem[]>(`/groups/${groupId}/transactions?month=${month}`),
        apiFetch<MonthSummary>(`/groups/${groupId}/summary?month=${month}`),
      ]);
      setItems(listData);
      setSummary(summaryData);
    } catch (createError) {
      setError(
        createError instanceof ApiError || createError instanceof Error
          ? createError.message
          : 'Não foi possível salvar o lançamento',
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiFetch(`/groups/${groupId}/transactions/${id}`, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.id !== id));
      const summaryData = await apiFetch<MonthSummary>(`/groups/${groupId}/summary?month=${month}`);
      setSummary(summaryData);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Não foi possível excluir o lançamento',
      );
    }
  }

  return (
    <section aria-labelledby="lancamentos-titulo" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="lancamentos-titulo" className="text-xl font-semibold">
          Entradas e saídas
        </h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="month" className="text-sm font-medium">
            Mês
          </label>
          <input
            id="month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
          />
        </div>
      </div>

      {summary ? (
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Entradas</dt>
            <dd className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              {formatBRL(summary.income)}
            </dd>
          </div>
          <div className="rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Saídas</dt>
            <dd className="mt-1 text-lg font-semibold text-red-700 dark:text-red-400">
              {formatBRL(summary.expense)}
            </dd>
          </div>
          <div className="rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">Saldo do mês</dt>
            <dd className="mt-1 text-lg font-semibold">{formatBRL(summary.balance)}</dd>
          </div>
        </dl>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {canCreate ? (
        <form
          onSubmit={(event) => void handleCreate(event)}
          className="grid gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2"
        >
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">Tipo</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'EXPENSE'}
                  onChange={() => setType('EXPENSE')}
                />
                Saída
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'INCOME'}
                  onChange={() => setType('INCOME')}
                />
                Entrada
              </label>
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Valor
            </label>
            <input
              id="amount"
              name="amount"
              inputMode="decimal"
              required
              placeholder="0,00"
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="occurredOn" className="text-sm font-medium">
              Data
            </label>
            <input
              id="occurredOn"
              name="occurredOn"
              type="date"
              required
              defaultValue={todayISODate()}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="categoryId" className="text-sm font-medium">
              Categoria
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            >
              <option value="">Selecione</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descrição
            </label>
            <input
              id="description"
              name="description"
              required
              maxLength={120}
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-foreground px-4 py-2.5 text-background hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Salvando…' : 'Adicionar lançamento'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-zinc-500">Sua permissão neste grupo é só de consulta.</p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum lançamento neste mês.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-zinc-500">
                  {item.category?.name ?? 'Sem categoria'} ·{' '}
                  {item.occurredOn.split('-').reverse().join('/')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={
                    item.type === 'INCOME'
                      ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                      : 'font-semibold text-red-700 dark:text-red-400'
                  }
                >
                  {item.type === 'INCOME' ? '+' : '-'}
                  {formatBRL(item.amount)}
                </p>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900"
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
