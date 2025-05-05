export type SupportedLocale = "en" | "ar";

type LocaleState = {
  locale: SupportedLocale;
  isOverlayVisible: boolean;
};

export const useLocaleStore = defineStore("locales", {
  state: (): LocaleState => ({
    locale: process.client
      ? (localStorage.getItem("locale") as SupportedLocale) || "en"
      : "en",
    isOverlayVisible: false,
  }),

  actions: {
    async updateLocale(newLocale: SupportedLocale) {
      this.isOverlayVisible = true;
      const nuxtApp = useNuxtApp();
      // Load messages first
      const messages = await import(`../locales/${newLocale}.json`);
      nuxtApp.$i18n.setLocaleMessage(newLocale, messages.default || messages);
      // Then update locale
      this.locale = newLocale;
      nuxtApp.$i18n.locale.value = newLocale;
      document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
      if (process.client) {
        localStorage.setItem("locale", newLocale);
      }
      setTimeout(() => {
        this.isOverlayVisible = false;
      }, 3000);
    },

    loadLocale(): void {
      if (process.client) {
        const savedLocale = localStorage.getItem("locale");
        this.locale =
          savedLocale === "en" || savedLocale === "ar" ? savedLocale : "en";
      }
    },
  },

  getters: {
    isRTL(state): boolean {
      return state.locale === "ar";
    },
  },
});
