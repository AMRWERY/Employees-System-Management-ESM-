import en from '../locales/en.json';
import ar from '../locales/ar.json';

type Locale = "en" | "ar";

export default defineNuxtPlugin((nuxtApp) => {
  const applyStoredLocale = (): void => {
    try {
      const storedLocale = localStorage.getItem("locale") || "en";

      // Only use valid locales
      const locale =
        storedLocale === "en" || storedLocale === "ar" ? storedLocale as Locale : "en";

      // Get i18n from the Nuxt app - using type assertion to avoid TypeScript errors
      const i18n = nuxtApp.$i18n as any;

      // Make sure the messages are loaded properly
      if (i18n) {
        if (locale === 'ar') {
          i18n.setLocaleMessage('ar', ar);
        } else {
          i18n.setLocaleMessage('en', en);
        }

        // Set the locale if needed
        if (i18n.locale.value !== locale) {
          i18n.setLocale(locale);
          
          // Also update HTML attributes
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        }
      }
    } catch (error) {
      console.error("Error applying stored locale:", error);
    }
  };

  // Apply locale on initial load
  applyStoredLocale();

  // Apply locale on page navigation
  nuxtApp.hook("page:finish", () => {
    applyStoredLocale();
  });
});
