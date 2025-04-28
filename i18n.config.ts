import en from "./locales/en.json";
import ar from "./locales/ar.json";
import type {
  DateTimeFormat,
  NumberFormat,
  LocaleMessage,
  MessageType,
} from "@intlify/core-base";

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

type Messages = {
  en: LocaleMessage<MessageType>;
  ar: LocaleMessage<MessageType>;
};

interface I18nConfig {
  legacy: boolean;
  locale: SupportedLocales;
  messages: Messages;
  datetimeFormats: DatetimeFormats;
  numberFormats: NumberFormats;
}

export default defineI18nConfig(
  (): I18nConfig => ({
    legacy: false,
    locale: "en",
    messages: { en, ar },
    datetimeFormats,
    numberFormats,
  })
);
