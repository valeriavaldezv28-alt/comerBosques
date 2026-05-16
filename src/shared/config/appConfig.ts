export type SupportedLanguage = "en" | "es";

export const APP_CONFIG = {
  DEFAULT_LANGUAGE: "en" as SupportedLanguage,
  LANGUAGE_STORAGE_KEY: "magictronic.i18nextLng",
  LEGACY_LANGUAGE_STORAGE_KEY: "i18nextLng",
  THEME_STORAGE_KEY: "magictronic.themeMode",
} as const;
