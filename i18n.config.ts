import en from "./locales/en.json";
import ar from "./locales/ar.json";
import type { DateTimeFormat, NumberFormat } from "@intlify/core-base";

type SupportedLocales = "en" | "ar";

type DatetimeFormats = {
  en: DateTimeFormat;
  ar: DateTimeFormat;
};

type NumberFormats = {
  en: NumberFormat;
  ar: NumberFormat;
};

const datetimeFormats: DatetimeFormats = {
  en: {
    short: {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
    long: {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
    },
  },
  ar: {
    short: {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
    long: {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    },
  },
};

const numberFormats: NumberFormats = {
  en: {
    currency: {
      style: "currency",
      currency: "EGP",
      notation: "standard",
    },
    decimal: {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: "percent",
      useGrouping: false,
    },
  },
  ar: {
    currency: {
      style: "currency",
      currency: "EGP",
      useGrouping: true,
      currencyDisplay: "symbol",
    },
    decimal: {
      style: "decimal",
      minimumSignificantDigits: 3,
      maximumSignificantDigits: 5,
    },
    percent: {
      style: "percent",
      useGrouping: false,
    },
  },
};

// console.log('EN locale:', en);
// console.log('AR locale:', ar);

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
    ar,
  },
  datetimeFormats,
  numberFormats,
  warnHtmlMessage: false,
  missingWarn: true,
  fallbackWarn: true,
}));
