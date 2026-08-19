export type ThemePreference = 'light' | 'dark' | 'system';
export type ContrastPreference = 'normal' | 'high';
export type MotionPreference = 'system' | 'always';
export type FontScale = 100 | 125 | 150;

export type UserPreferences = {
  theme: ThemePreference;
  contrast: ContrastPreference;
  fontScale: FontScale;
  reduceMotion: MotionPreference;
  hideAmounts: boolean;
  underlineLinks: boolean;
  comfortableReading: boolean;
  plainBackground: boolean;
};

export const PREFS_KEY = 'gf_prefs';

export const DEFAULT_PREFS: UserPreferences = {
  theme: 'system',
  contrast: 'normal',
  fontScale: 100,
  reduceMotion: 'system',
  hideAmounts: false,
  underlineLinks: false,
  comfortableReading: false,
  plainBackground: false,
};

export function readPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFS;
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return DEFAULT_PREFS;
    }
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      theme:
        parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system'
          ? parsed.theme
          : DEFAULT_PREFS.theme,
      contrast: parsed.contrast === 'high' ? 'high' : 'normal',
      fontScale:
        parsed.fontScale === 125 || parsed.fontScale === 150 ? parsed.fontScale : 100,
      reduceMotion: parsed.reduceMotion === 'always' ? 'always' : 'system',
      hideAmounts: parsed.hideAmounts === true,
      underlineLinks: parsed.underlineLinks === true,
      comfortableReading: parsed.comfortableReading === true,
      plainBackground: parsed.plainBackground === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

let snapshot: UserPreferences = DEFAULT_PREFS;

function samePrefs(a: UserPreferences, b: UserPreferences) {
  return (
    a.theme === b.theme &&
    a.contrast === b.contrast &&
    a.fontScale === b.fontScale &&
    a.reduceMotion === b.reduceMotion &&
    a.hideAmounts === b.hideAmounts &&
    a.underlineLinks === b.underlineLinks &&
    a.comfortableReading === b.comfortableReading &&
    a.plainBackground === b.plainBackground
  );
}

export function applyPreferences(prefs: UserPreferences) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark);
  root.classList.toggle('dark', dark);
  if (prefs.contrast === 'high') {
    root.dataset.contrast = 'high';
  } else {
    delete root.dataset.contrast;
  }
  root.style.fontSize = `${prefs.fontScale}%`;
  if (prefs.reduceMotion === 'always') {
    root.dataset.reduceMotion = 'always';
  } else {
    delete root.dataset.reduceMotion;
  }
  if (prefs.underlineLinks) {
    root.dataset.underlineLinks = 'on';
  } else {
    delete root.dataset.underlineLinks;
  }
  if (prefs.comfortableReading) {
    root.dataset.reading = 'comfortable';
  } else {
    delete root.dataset.reading;
  }
  if (prefs.plainBackground) {
    root.dataset.plainBg = 'on';
  } else {
    delete root.dataset.plainBg;
  }
}

const listeners = new Set<() => void>();

export function subscribePreferences(onChange: () => void) {
  listeners.add(onChange);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function onSystemTheme() {
    applyPreferences(getPreferencesSnapshot());
  }
  media.addEventListener('change', onSystemTheme);
  function onStorage(event: StorageEvent) {
    if (event.key === PREFS_KEY) {
      snapshot = readPreferences();
      applyPreferences(snapshot);
      onChange();
    }
  }
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener('change', onSystemTheme);
    window.removeEventListener('storage', onStorage);
  };
}

export function getPreferencesSnapshot(): UserPreferences {
  const next = readPreferences();
  if (!samePrefs(snapshot, next)) {
    snapshot = next;
  }
  return snapshot;
}

export function savePreferences(prefs: UserPreferences) {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  snapshot = prefs;
  applyPreferences(prefs);
  listeners.forEach((listener) => listener());
}
