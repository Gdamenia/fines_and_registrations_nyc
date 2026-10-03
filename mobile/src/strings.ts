// UI language for the Tixradar app.
//
// Strings are keyed by their English text: `t('Add Vehicle')` returns the translation
// for the current language and falls back to the English text itself, so a missing
// translation can never blank out the UI. Placeholders use `{name}` syntax:
// `t('Paid ({count})', { count: 3 })`.
//
// The current language is module state, set from the App root on every render
// (setLanguage). Changing language re-renders the whole tree from the root, so plain
// helper functions that call t() (greetings, labels, dates) pick it up too.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from './i18n';
import { TRANSLATIONS } from './translations';

export type { Lang };

export const LANGUAGE_KEY = 'tixradar:language';

/** The languages offered on the first screen, in display order. */
export const APP_LANGUAGES: { code: Lang; flag: string; name: string }[] = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'ka', flag: '🇬🇪', name: 'ქართული' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
];

const LOCALES: Record<Lang, string> = { en: 'en-US', ru: 'ru-RU', ka: 'ka-GE', es: 'es-US' };

let current: Lang = 'en';

export function isLang(value: unknown): value is Lang {
  return APP_LANGUAGES.some((item) => item.code === value);
}

export function setLanguage(lang: Lang) {
  current = lang;
}

export function getLanguage(): Lang {
  return current;
}

/** Locale for Intl / toLocale*String date and number formatting. */
export function getLocale(): string {
  return LOCALES[current];
}

export function t(text: string, vars?: Record<string, string | number>): string {
  const translated = current === 'en' ? text : TRANSLATIONS[current]?.[text] ?? text;
  if (!vars) return translated;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

export async function loadSavedLanguage(): Promise<Lang | null> {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  return isLang(saved) ? saved : null;
}

export async function saveLanguage(lang: Lang) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}
