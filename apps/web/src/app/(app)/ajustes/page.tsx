'use client';

import { RequireAuth } from '@/components/require-auth';
import { AccountSettings } from '@/components/account-settings';
import { usePreferences } from '@/components/preferences-provider';
import type { ContrastPreference, FontScale, MotionPreference, ThemePreference } from '@/lib/preferences';
import { fieldClass, surfaceClass } from '@/lib/ui';

export default function SettingsPage() {
  const { prefs, updatePrefs } = usePreferences();

  return (
    <RequireAuth nextPath="/ajustes">
      <main id="conteudo-principal" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
        <h1 className="text-3xl tracking-tight">Ajustes</h1>

        <section className={`${surfaceClass} flex flex-col gap-6 p-5 sm:p-6`} aria-labelledby="conta-titulo">
          <h2 id="conta-titulo" className="sr-only">
            Conta
          </h2>
          <AccountSettings />
        </section>

        <section className={`${surfaceClass} flex flex-col gap-6 p-5 sm:p-6`} aria-labelledby="leitura-titulo">
          <div>
            <h2 id="leitura-titulo" className="text-lg font-medium">
              Aparência e leitura
            </h2>
            <p className="mt-1 text-sm text-muted">Só neste navegador.</p>
          </div>

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

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">Leitura</legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={prefs.underlineLinks}
                onChange={(event) => updatePrefs({ underlineLinks: event.target.checked })}
              />
              <span>
                Sublinhar links
                <span className="block text-muted">Fica mais fácil achar o que é clicável.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={prefs.comfortableReading}
                onChange={(event) => updatePrefs({ comfortableReading: event.target.checked })}
              />
              <span>
                Mais espaço entre linhas
                <span className="block text-muted">Texto menos apertado.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={prefs.plainBackground}
                onChange={(event) => updatePrefs({ plainBackground: event.target.checked })}
              />
              <span>
                Fundo liso
                <span className="block text-muted">Tira o degradê atrás das telas.</span>
              </span>
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Privacidade</legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={prefs.hideAmounts}
                onChange={(event) => updatePrefs({ hideAmounts: event.target.checked })}
              />
              <span>
                Ocultar valores
                <span className="block text-muted">Esconde os reais neste aparelho.</span>
              </span>
            </label>
          </fieldset>
        </section>
      </main>
    </RequireAuth>
  );
}
