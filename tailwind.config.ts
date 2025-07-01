import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      //   colors: {
      //   lightText: {
      //     primary: '#1a1a1a',
      //     secondary: '#4b4b4b',
      //     muted: '#757575',
      //   },
      //   darkText: {
      //     primary: '#f8f8f2',
      //     secondary: '#d6d6d6',
      //     muted: '#999999',
      //   },
      // },
      // screens: {
      //   xs: "414px",
      //   // => @media (min-width: 414px) { ... }
      //   sm: "576px",
      //   // => @media (min-width: 576px) { ... }
      //   md: "960px",
      //   // => @media (min-width: 960px) { ... }
      //   lg: "1440px",
      //   // => @media (min-width: 1440px) { ... }
      // },
      // fontFamily: {
      //   montserrat: ["Montserrat", "sans-serif"],
      // },
      // fontWeight: {
      //   100: "100", //font-thin
      //   200: "200", //font-extralight
      //   300: "300", //font-light
      //   400: "400", //font-normal
      //   500: "500", //font-medium
      //   600: "600", //font-semibold
      //   700: "700", //font-bold
      //   800: "800", //ont-extrabold
      //   900: "900", //font-black
      // },
    },
  },
  corePlugins: {
    aspectRatio: false,
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),
    require("tailwindcss-rtl"),
  ],
} satisfies Config;
