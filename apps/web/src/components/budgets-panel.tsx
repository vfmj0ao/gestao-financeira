'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { currentMonth, maskMoney, shiftMonth } from '@/lib/money';
import type { BudgetMonth } from '@/lib/types';
import { usePreferences } from '@/components/preferences-provider';

type BudgetsPanelProps = {
  groupId: string;
  permissions: string[];
};

export function BudgetsPanel({ groupId, permissions }: BudgetsPanelProps) {
  const { prefs } = usePreferences();
  const canEdit = permissions.includes('TRANSACTIONS_CREATE');
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<BudgetMonth | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const hidden = prefs.hideAmounts;

  useEffect(() => {
    void (async () => {
      try {
        const result = await apiFetch<BudgetMonth>(
          `/groups/${groupId}/budgets?month=${month}`,
        );
        setData(result);
        setDrafts(
          Object.fromEntries(
            result.items.map((item) => [
              item.categoryId,
              item.limit ? item.limit.replace('.', ',') : '',
            ]),
          ),
        );
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar orçamentos');
      }
    })();
  }, [groupId, month]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await apiFetch<BudgetMonth>(`/groups/${groupId}/budgets`, {
        method: 'PUT',
        body: JSON.stringify({
          month,
          items: data.items.map((item) => {
            const raw = (drafts[item.categoryId] ?? '').trim();
            return {
              categoryId: item.categoryId,
              amount: raw === '' ? null : raw,
            };
          }),
        }),
      });
      setData(result);
      setDrafts(
        Object.fromEntries(
          result.items.map((item) => [
            item.categoryId,
            item.limit ? item.limit.replace('.', ',') : '',
          ]),
        ),
      );
    } catch (saveError) {
      setError(
        saveError instanceof ApiError || saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar',
      );
    } finally {
      setPending(false);
    }
  }

  async function handleCopy() {
    setPending(true);
    setError(null);
    try {
      const result = await apiFetch<BudgetMonth>(`/groups/${groupId}/budgets/copy`, {
        method: 'POST',
        body: JSON.stringify({
          fromMonth: shiftMonth(month, -1),
          toMonth: month,
        }),
      });
      setData(result);
      setDrafts(
        Object.fromEntries(
          result.items.map((item) => [
            item.categoryId,
            item.limit ? item.limit.replace('.', ',') : '',
          ]),
        ),
      );
    } catch (copyError) {
      setError(
        copyError instanceof ApiError || copyError instanceof Error
          ? copyError.message
          : 'Não foi possível copiar',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <label htmlFor="budget-month" className="text-sm font-medium">
            Mês
          </label>
          <input
            id="budget-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-lg border border-zinc-300 bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
          />
        </div>
        {canEdit ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleCopy()}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm disabled:opacity-60 dark:border-zinc-600"
          >
            Copiar mês anterior
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {data ? (
        <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-4">
          <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {data.items.map((item) => {
              const spentRatio =
                item.limit && Number.parseFloat(item.limit) > 0
                  ? Math.min(100, Math.round((Number.parseFloat(item.spent) / Number.parseFloat(item.limit)) * 100))
                  : 0;
              return (
                <li key={item.categoryId} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      Gasto {maskMoney(item.spent, hidden)}
                      {item.limit ? ` · limite ${maskMoney(item.limit, hidden)}` : ''}
                    </p>
                    {item.limit ? (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span
                          className={`block h-full rounded-full ${item.over ? 'bg-rose-700' : 'bg-teal-700'}`}
                          style={{ width: `${Math.max(item.spent === '0.00' ? 0 : 6, spentRatio)}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-xs text-zinc-500">Limite</span>
                      <input
                        inputMode="decimal"
                        value={drafts[item.categoryId] ?? ''}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.categoryId]: event.target.value,
                          }))
                        }
                        placeholder="—"
                        className="w-36 rounded-lg border border-zinc-300 bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
                      />
                    </label>
                  ) : (
                    <p className="text-sm tabular-nums">
                      {item.limit ? maskMoney(item.limit, hidden) : 'Sem limite'}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          {canEdit ? (
            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-lg bg-foreground px-4 py-2.5 text-background disabled:opacity-60"
            >
              {pending ? 'Salvando…' : 'Salvar'}
            </button>
          ) : null}
        </form>
      ) : (
        <p>Carregando…</p>
      )}
    </section>
  );
}
