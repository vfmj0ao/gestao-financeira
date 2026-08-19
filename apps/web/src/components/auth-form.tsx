'use client';

import { useState, type FormEvent } from 'react';
import { btnPrimaryClass, fieldClass } from '@/lib/ui';

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
};

type AuthFormProps = {
  title: string;
  submitLabel: string;
  error?: string | null;
  pending?: boolean;
  fields: Field[];
  onSubmit: (form: FormData) => Promise<void>;
};

export function AuthForm({ title, submitLabel, error, pending, fields, onSubmit }: AuthFormProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const message = error ?? localError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const form = new FormData(event.currentTarget);
    try {
      await onSubmit(form);
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Erro inesperado');
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-line bg-card p-6 shadow-[0_8px_30px_rgba(28,25,23,0.04)] sm:p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {message ? (
        <p
          role="alert"
          className="rounded-xl border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense"
        >
          {message}
        </p>
      ) : null}
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type ?? 'text'}
            autoComplete={field.autoComplete}
            required={field.required ?? true}
            defaultValue={field.defaultValue}
            className={fieldClass}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className={btnPrimaryClass}
      >
        {pending ? 'Aguarde…' : submitLabel}
      </button>
    </form>
  );
}
