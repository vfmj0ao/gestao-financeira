'use client';

import { RequireAuth } from '@/components/require-auth';
import { usePreferences } from '@/components/preferences-provider';
import type { ContrastPreference, FontScale, MotionPreference, ThemePreference } from '@/lib/preferences';

export default function SettingsPage() {
  const { prefs, updatePrefs } = usePreferences();

  return (
    <RequireAuth nextPath="/ajustes">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ajustes</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Estas opções ficam neste aparelho e valem para facilitar a leitura e o contraste.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Tema</legend>
          <select
            value={prefs.theme}
            onChange={(event) =>
              updatePrefs({ theme: event.target.value as ThemePreference })
            }
            className="max-w-xs rounded-lg border border-zinc-300 bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
          >
            <option value="system">Igual ao sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Tamanho do texto</legend>
          <select
            value={prefs.fontScale}
            onChange={(event) =>
              updatePrefs({ fontScale: Number(event.target.value) as FontScale })
            }
            className="max-w-xs rounded-lg border border-zinc-300 bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
          >
            <option value={100}>Normal</option>
            <option value={125}>Grande</option>
            <option value={150}>Muito grande</option>
          </select>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Contraste</legend>
          <select
            value={prefs.contrast}
            onChange={(event) =>
              updatePrefs({ contrast: event.target.value as ContrastPreference })
            }
            className="max-w-xs rounded-lg border border-zinc-300 bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
          >
            <option value="normal">Padrão</option>
            <option value="high">Alto</option>
          </select>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Movimento</legend>
          <select
            value={prefs.reduceMotion}
            onChange={(event) =>
              updatePrefs({ reduceMotion: event.target.value as MotionPreference })
            }
            className="max-w-xs rounded-lg border border-zinc-300 bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-zinc-600"
          >
            <option value="system">Seguir o sistema</option>
            <option value="always">Reduzir sempre</option>
          </select>
        </fieldset>
      </main>
    </RequireAuth>
  );
}
