export type SupportedLanguage = "en" | "es";

export const APP_CONFIG = {
  DEFAULT_LANGUAGE: "es" as SupportedLanguage,
  LANGUAGE_STORAGE_KEY: "comercializadora-bosques.i18nextLng",
  THEME_STORAGE_KEY: "comercializadora-bosques.themeMode",
} as const;
