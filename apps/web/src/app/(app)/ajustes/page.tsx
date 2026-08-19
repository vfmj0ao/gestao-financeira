'use client';

import { RequireAuth } from '@/components/require-auth';
import { usePreferences } from '@/components/preferences-provider';
import type { ContrastPreference, FontScale, MotionPreference, ThemePreference } from '@/lib/preferences';
import { fieldClass } from '@/lib/ui';

export default function SettingsPage() {
  const { prefs, updatePrefs } = usePreferences();

  return (
    <RequireAuth nextPath="/ajustes">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
        <h1 className="text-3xl tracking-tight">Ajustes</h1>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Tema</legend>
          <select
            value={prefs.theme}
            onChange={(event) =>
              updatePrefs({ theme: event.target.value as ThemePreference })
            }
            className={`max-w-xs ${fieldClass}`}
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
            className={`max-w-xs ${fieldClass}`}
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
            className={`max-w-xs ${fieldClass}`}
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
            className={`max-w-xs ${fieldClass}`}
          >
            <option value="system">Seguir o sistema</option>
            <option value="always">Reduzir sempre</option>
          </select>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Privacidade</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.hideAmounts}
              onChange={(event) => updatePrefs({ hideAmounts: event.target.checked })}
            />
            Ocultar valores
          </label>
        </fieldset>
      </main>
    </RequireAuth>
  );
}
