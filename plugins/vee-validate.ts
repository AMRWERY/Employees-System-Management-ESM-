import { defineRule, configure } from "vee-validate";
import {
  required,
  min,
  alpha_spaces,
  max,
  regex,
  between,
  numeric,
  length,
} from "@vee-validate/rules";
import { localize, setLocale } from "@vee-validate/i18n";
import en from "@vee-validate/i18n/dist/locale/en.json";
import ar from "@vee-validate/i18n/dist/locale/ar.json";
import inputsEn from "~/locales/en.json";
import inputsAr from "~/locales/ar.json";
import type { I18nTypes } from "@/types/i18n-types";

export default defineNuxtPlugin((nuxtApp) => {
  // Type assertion for i18n
  const i18n = nuxtApp.$i18n as I18nTypes;

  defineRule("required", required);
  defineRule("email", (value: any): string | boolean => {
    if (!value || !value.length) {
      return true;
    }
    // if (!/^[A-Z0-9._%+-]+@ship\.com$/i.test(value)) {
    //   return i18n.t("form.email_valid_ship_error");
    // }
    return true;
  });

  defineRule("minLength", (value: any, [limit]: [number]): string | boolean => {
    if (!value || !value.length) {
      return true;
    }
    if (value.length < limit) {
      return i18n.t("form.minLengthError", { limit });
    }
    return true;
  });

  defineRule("confirmed", (value: any, [target]: [any]): string | boolean => {
    if (value === target) {
      return true;
    }
    return i18n.t("form.passwords_must_match");
  });

  defineRule("terms_required", (value: boolean) => {
    return !!value || i18n.t("form.terms_required");
  });

  defineRule("min", min);
  defineRule("alpha_spaces", alpha_spaces);
  defineRule("max", max);
  defineRule("regex", regex);
  defineRule("between", between);
  defineRule("numeric", numeric);
  defineRule("length", length);

  const updateValidationLocale = (locale: string): void => {
    const messages: Record<string, any> = {
      en: {
        ...en,
        messages: {
          ...en.messages,
          required: "{field} is required",
          // Add other overrides here
        },
        names: inputsEn.form,
      },
      ar: {
        ...ar,
        messages: {
          ...ar.messages,
          required: "{field} مطلوب",
        },
        names: inputsAr.form,
      },
    };

    configure({
      generateMessage: localize({
        [locale]: {
          ...messages[locale],
          names: messages[locale].names,
        },
      }),
      validateOnBlur: true,
      validateOnChange: false,
      validateOnInput: true,
      validateOnModelUpdate: true,
    });
    setLocale(locale);
  };

  if (process.client) {
    const initialLocale = localStorage.getItem("locale") || "en";
    updateValidationLocale(initialLocale);
  }

  const localeStore = useLocaleStore();

  watch(
    () => localeStore.locale,
    (newLocale: string) => {
      updateValidationLocale(newLocale);
      i18n.setLocale(newLocale);
    }
  );
});
