// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: false,
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    "@vee-validate/nuxt",
  ],
  imports: {
    presets: [
      {
        from: "@vueuse/core",
        imports: ["promiseTimeout", "useTimeoutPoll"],
      },
    ],
  },
  tailwindcss: {
    cssPath: ["~/assets/css/tailwind.css", { injectPosition: "first" }],
    viewer: true,
    exposeConfig: false,
  },
  pinia: {
    storesDirs: ["./stores/**", "./custom-folder/stores/**"],
  },
  i18n: {
    vueI18n: "./i18n.config.ts",
    locales: ["en", "ar"],
    defaultLocale: "en",
    // strategy: "prefix",
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      fallbackLocale: "en",
      redirectOn: "all",
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  veeValidate: {
    autoImports: true,
  },
  experimental: {
    payloadExtraction: true, // Fix for client-side routing
  },
  router: {
    options: {
      strict: false, // Allow trailing slashes
    },
  },
  plugins: [
    "~/plugins/locale.client.ts",
    "~/plugins/auth.client.ts",
    "~/plugins/log-routes.client.ts",
  ],
  css: ["~/assets/css/main.css"],
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  app: {
    head: {
      title: "Employees Management System",
      script: [{}],
      noscript: [],
      link: [{}],
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          charset: "utf-8",
        },
      ],
    },
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },
  },
});
