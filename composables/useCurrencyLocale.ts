type LocaleMap = {
  en: string;
  ar: string;
};

type CurrencyLocaleMap = {
  [key: string]: LocaleMap;
} & {
  DEFAULT: LocaleMap;
};

const currencyLocaleMap: CurrencyLocaleMap = {
  // Arab League Countries in Africa
  EGP: { en: "en-EG", ar: "ar-EG" }, // Egypt
  DZD: { en: "en-DZ", ar: "ar-DZ" }, // Algeria
  MAD: { en: "en-MA", ar: "ar-MA" }, // Morocco
  TND: { en: "en-TN", ar: "ar-TN" }, // Tunisia
  LYD: { en: "en-LY", ar: "ar-LY" }, // Libya
  SDG: { en: "en-SD", ar: "ar-SD" }, // Sudan
  DJF: { en: "en-DJ", ar: "ar-DJ" }, // Djibouti
  MRU: { en: "en-MR", ar: "ar-MR" }, // Mauritania
  KMF: { en: "en-KM", ar: "ar-KM" }, // Comoros
  SOS: { en: "en-SO", ar: "ar-SO" }, // Somalia
  // Arab League Countries in Asia
  SAR: { en: "en-SA", ar: "ar-SA" }, // Saudi Arabia
  AED: { en: "en-AE", ar: "ar-AE" }, // UAE
  QAR: { en: "en-QA", ar: "ar-QA" }, // Qatar
  KWD: { en: "en-KW", ar: "ar-KW" }, // Kuwait
  OMR: { en: "en-OM", ar: "ar-OM" }, // Oman
  BHD: { en: "en-BH", ar: "ar-BH" }, // Bahrain
  JOD: { en: "en-JO", ar: "ar-JO" }, // Jordan
  IQD: { en: "en-IQ", ar: "ar-IQ" }, // Iraq
  LBP: { en: "en-LB", ar: "ar-LB" }, // Lebanon
  SYP: { en: "en-SY", ar: "ar-SY" }, // Syria
  YER: { en: "en-YE", ar: "ar-YE" }, // Yemen
  PSD: { en: "en-PS", ar: "ar-PS" }, // Palestine

  // Default fallback for currencies without a specific country mapping
  DEFAULT: { en: "en-US", ar: "ar-EG" },
};

export function useCurrencyLocale() {
  const { locale } = useI18n();

  const currentCurrency = ref("EGP");

  const currencyLocale = computed(() => {
    const lang = locale.value; // Now typed as 'en' | 'ar'
    const mapping = currencyLocaleMap[currentCurrency.value] || currencyLocaleMap.DEFAULT;
    return mapping[lang]; // TypeScript knows lang is 'en' | 'ar'
  });
  // const currencyLocale = computed(() => {
  //   const lang = locale.value as "en" | "ar";
  //   const currency = currentCurrency.value as keyof typeof currencyLocaleMap;

  //   const mapping = currencyLocaleMap[currency] || currencyLocaleMap.DEFAULT;

  //   return mapping[lang];
  // });

  return {
    currentCurrency,
    currencyLocale,
  };
}
