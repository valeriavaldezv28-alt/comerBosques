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

    return idiomaGuardado === "es" ? "es" : APP_CONFIG.DEFAULT_LANGUAGE;
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

    // Idioma de respaldo si no se detecta uno válido
    fallbackLng: APP_CONFIG.DEFAULT_LANGUAGE,

    // Idiomas soportados por la aplicación
    supportedLngs: ["en", "es"],

    interpolation: {
      escapeValue: false,
    },

    detection: {
      // Prioridad de detección del idioma (USA-first: English por defecto)
      // 1. localStorage: si el usuario ya seleccionó un idioma
      // 2. en: si no hay nada guardado, usar English por defecto para USA
      order: ["localStorage"],

      // Guarda el idioma seleccionado
      caches: ["localStorage"],

      // Clave usada en localStorage
      lookupLocalStorage: APP_CONFIG.LANGUAGE_STORAGE_KEY,
    },
  });

// Establece el idioma inicial del documento HTML
document.documentElement.lang = i18n.language;

// Actualiza el atributo lang cuando cambia el idioma
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
