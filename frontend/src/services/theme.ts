export type ThemePreference = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'hopemind.theme';
const THEME_COLORS = { light: '#f5f5f7', dark: '#000000' };

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === 'auto') delete root.dataset.theme;
  else root.dataset.theme = preference;

  const dark = preference === 'dark' || (preference === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Private mode: the choice just won't persist.
  }
  applyTheme(preference);
}
