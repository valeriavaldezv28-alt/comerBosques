import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { APP_CONFIG, type SupportedLanguage } from "@/shared/config/appConfig";

import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";

const resources = {
  en: {
    common: enCommon,
  },
  es: {
    common: esCommon,
  },
} as const;

const obtenerIdiomaInicial = (): SupportedLanguage => {
  try {
    const idiomaGuardado =
      typeof window !== "undefined"
        ? window.localStorage.getItem(APP_CONFIG.LANGUAGE_STORAGE_KEY)
        : null;

    return idiomaGuardado === "en" || idiomaGuardado === "es"
      ? idiomaGuardado
      : APP_CONFIG.DEFAULT_LANGUAGE;
  } catch {
    return APP_CONFIG.DEFAULT_LANGUAGE;
  }
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: "common",
    lng: obtenerIdiomaInicial(),
    fallbackLng: APP_CONFIG.DEFAULT_LANGUAGE,
    supportedLngs: ["en", "es"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: APP_CONFIG.LANGUAGE_STORAGE_KEY,
    },
  });

document.documentElement.lang = i18n.language;

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
