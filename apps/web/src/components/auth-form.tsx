'use client';

import { useState, type FormEvent } from 'react';

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
      className="flex w-full max-w-md flex-col gap-5"
    >
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {message ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
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
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-700"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-4 py-2.5 text-background hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Aguarde…' : submitLabel}
      </button>
    </form>
  );
}
