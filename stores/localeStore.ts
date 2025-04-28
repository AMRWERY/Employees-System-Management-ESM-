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
    updateLocale(value: SupportedLocale): void {
      this.isOverlayVisible = true;
      this.locale = value;
      if (process.client) {
        localStorage.setItem("locale", value);
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
