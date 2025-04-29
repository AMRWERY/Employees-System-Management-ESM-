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
  email as emailRule,
} from "@vee-validate/rules";
import { localize, setLocale } from "@vee-validate/i18n";
import en from "@vee-validate/i18n/dist/locale/en.json";
import ar from "@vee-validate/i18n/dist/locale/ar.json";
import inputsEn from "~/locales/en.json";
import inputsAr from "~/locales/ar.json";

// Create wrapper functions to handle different parameter expectations
// The key is to match the exact TypeScript signatures while providing implementations
// that work with the actual runtime behavior

// Helper to ensure we always provide the second param as required by TypeScript
const safeRequired = (
  value: any
): string | boolean | Promise<string | boolean> => {
  // TypeScript definition might expect a second param, but runtime doesn't use it
  return required(value);
};

// For alpha_spaces, we need to check the actual implementation
// Let's try without the second parameter to match the runtime behavior
const safeAlphaSpaces = (
  value: any
): string | boolean | Promise<string | boolean> => {
  // Some versions of vee-validate may not accept a second parameter at runtime
  // @ts-ignore - Ignoring TypeScript error to make runtime work
  return alpha_spaces(value);
};

// For numeric, we need to check the actual implementation
const safeNumeric = (
  value: any
): string | boolean | Promise<string | boolean> => {
  // Some versions of vee-validate may not accept a second parameter at runtime
  // @ts-ignore - Ignoring TypeScript error to make runtime work
  return numeric(value);
};

// For min, we need to format the second parameter as an array
const safeMin = (
  value: any,
  minValue: number
): string | boolean | Promise<string | boolean> => {
  // Required format per TypeScript: (value: unknown, params: [number] | { min: number; }): boolean
  return min(value, [minValue]);
};

// For max, we need to format the second parameter as an array
const safeMax = (
  value: any,
  maxValue: number
): string | boolean | Promise<string | boolean> => {
  // Required format per TypeScript: (value: unknown, params: [number] | { max: number; }): boolean
  return max(value, [maxValue]);
};

// For length, we need to format the second parameter as an array
const safeLength = (
  value: any,
  len: number
): string | boolean | Promise<string | boolean> => {
  // Required format per TypeScript: (value: unknown, params: [number] | { length: number; }): boolean
  return length(value, [len]);
};

// For regex, we need to format the second parameter as an array
const safeRegex = (
  value: any,
  pattern: RegExp | string
): string | boolean | Promise<string | boolean> => {
  // Required format per TypeScript: (value: unknown, params: [RegExp] | { regex: RegExp; }): boolean
  return regex(value, [pattern]);
};

// For between, we need to format the second parameter as an array with min and max
const safeBetween = (
  value: any,
  min: number,
  max: number
): string | boolean | Promise<string | boolean> => {
  // Required format per TypeScript: (value: unknown, params: [min: number, max: number]): boolean
  return between(value, [min, max]);
};

// For email, safely use the standard email rule
const safeEmail = (
  value: any
): string | boolean | Promise<string | boolean> => {
  // @ts-ignore - Ignoring TypeScript error to make runtime work
  return emailRule(value);
};

export default defineNuxtPlugin((nuxtApp) => {
  // Error handler for validation rule errors
  const handleValidationError = (error: unknown, ruleName: string): string => {
    console.error(`Error in validation rule '${ruleName}':`, error);
    return "An error occurred during validation. Please try again.";
  };

  // Type-safe i18n wrapper
  const t = (key: string, params?: Record<string, any>): string => {
    return (nuxtApp.$i18n as any)?.t?.(key, params) || key;
  };

  // Define rules with error handling
  defineRule(
    "required",
    (value: any): string | boolean | Promise<string | boolean> => {
      try {
        if (!value && value !== 0) {
          return t("form.field_required");
        }
        if (typeof value === "string" && !value.trim().length) {
          return t("form.field_required");
        }
        return safeRequired(value);
      } catch (error: unknown) {
        return handleValidationError(error, "required");
      }
    }
  );

  defineRule(
    "email",
    (value: any): string | boolean | Promise<string | boolean> => {
      try {
        if (!value || !value.length) {
          return true;
        }

        // Check for basic email format
        const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailPattern.test(value)) {
          return t("form.email_invalid");
        }

        // If you need to restrict to ship.com domain, uncomment this:
        // if (!/^[A-Z0-9._%+-]+@ship\.com$/i.test(value)) {
        //   return t("form.email_valid_ship_error");
        // }

        return true;
      } catch (error: unknown) {
        return handleValidationError(error, "email");
      }
    }
  );

  // Add a general email validator without domain restriction
  defineRule(
    "any_email",
    (value: any): string | boolean | Promise<string | boolean> => {
      try {
        if (!value || !value.length) {
          return true;
        }
        // Just use the standard email validator without domain check
        return safeEmail(value) || t("form.email_invalid");
      } catch (error: unknown) {
        return handleValidationError(error, "any_email");
      }
    }
  );

  defineRule(
    "minLength",
    (
      value: any,
      params: any[]
    ): string | boolean | Promise<string | boolean> => {
      try {
        if (!value || !value.length) {
          return true;
        }
        const limit = params?.[0] as number;
        if (value.length < limit) {
          return t("form.minLengthError", { limit });
        }
        return true;
      } catch (error: unknown) {
        return handleValidationError(error, "minLength");
      }
    }
  );

  defineRule(
    "confirmed",
    (
      value: any,
      params: any[]
    ): string | boolean | Promise<string | boolean> => {
      try {
        const target = params?.[0];
        if (value === target) {
          return true;
        }
        return t("form.passwords_must_match");
      } catch (error: unknown) {
        return handleValidationError(error, "confirmed");
      }
    }
  );

  defineRule(
    "min",
    (
      value: any,
      params: any[]
    ): string | boolean | Promise<string | boolean> => {
      try {
        const minValue = params?.[0] as number;
        return safeMin(value, minValue);
      } catch (error: unknown) {
        return handleValidationError(error, "min");
      }
    }
  );

  defineRule(
    "alpha_spaces",
    (value: any): string | boolean | Promise<string | boolean> => {
      try {
        if (!value || !value.length) {
          return true;
        }
        return safeAlphaSpaces(value);
      } catch (error: unknown) {
        return handleValidationError(error, "alpha_spaces");
      }
    }
  );

  defineRule(
    "max",
    (
      value: any,
      params: any[]
    ): string | boolean | Promise<string | boolean> => {
      try {
        const maxValue = params?.[0] as number;
        return safeMax(value, maxValue);
      } catch (error: unknown) {
        return handleValidationError(error, "max");
      }
    }
  );

  defineRule(
    "regex",
    (
      value: any,
      params: any[]
    ): string | boolean | Promise<string | boolean> => {
      try {
        const pattern = params?.[0] as RegExp | string;
        return safeRegex(value, pattern);
      } catch (error: unknown) {
        return handleValidationError(error, "regex");
      }
    }
  );

  defineRule(
    "between",
    (
      value: any,
      params: any[]
    ): string | boolean | Promise<string | boolean> => {
      try {
        const minValue = params?.[0] as number;
        const maxValue = params?.[1] as number;
        return safeBetween(value, minValue, maxValue);
      } catch (error: unknown) {
        return handleValidationError(error, "between");
      }
    }
  );

  defineRule(
    "numeric",
    (value: any): string | boolean | Promise<string | boolean> => {
      try {
        if (!value || !value.length) {
          return true;
        }
        return safeNumeric(value);
      } catch (error: unknown) {
        return handleValidationError(error, "numeric");
      }
    }
  );

  defineRule(
    "length",
    (
      value: any,
      params: any[]
    ): string | boolean | Promise<string | boolean> => {
      try {
        const len = params?.[0] as number;
        return safeLength(value, len);
      } catch (error: unknown) {
        return handleValidationError(error, "length");
      }
    }
  );

  const updateValidationLocale = (locale: string) => {
    try {
      const messages: Record<string, any> = {
        en: { ...en, names: inputsEn.form },
        ar: { ...ar, names: inputsAr.form },
      };

      // Check if the locale exists before using it
      const validLocale = locale in messages ? locale : "en";

      configure({
        generateMessage: localize(validLocale, messages[validLocale]),
        validateOnBlur: true,
        validateOnChange: false,
        validateOnInput: true,
        validateOnModelUpdate: true,
      });
      setLocale(validLocale);
    } catch (error: unknown) {
      console.error("Error configuring validation locale:", error);

      // Fallback to English if error occurs
      if (locale !== "en") {
        try {
          configure({
            generateMessage: localize("en", { ...en, names: inputsEn.form }),
            validateOnBlur: true,
            validateOnChange: false,
            validateOnInput: true,
            validateOnModelUpdate: true,
          });
          setLocale("en");
        } catch (fallbackError: unknown) {
          console.error(
            "Critical validation error - even fallback failed:",
            fallbackError
          );
        }
      }
    }
  };

  if (process.client) {
    try {
      const initialLocale = localStorage.getItem("locale") || "en";
      updateValidationLocale(initialLocale);
    } catch (error: unknown) {
      console.error("Error setting initial validation locale:", error);
      updateValidationLocale("en"); // Fallback to English
    }
  }

  const localeStore = useLocaleStore();

  watch(
    () => localeStore.locale,
    (newLocale) => {
      try {
        updateValidationLocale(newLocale);
        // Safe access to i18n methods
        (nuxtApp.$i18n as any)?.setLocale?.(newLocale);
      } catch (error: unknown) {
        console.error("Error updating locale:", error);
      }
    }
  );
});
