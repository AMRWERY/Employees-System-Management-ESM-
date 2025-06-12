import type { Router } from "vue-router";

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    // Assert that nuxtApp.$router is an instance of Vue Router
    const router = nuxtApp.$router as Router;

    if (router && typeof router.getRoutes === "function") {
      // Extra safety check
      const routes = router.getRoutes();

      // console.groupCollapsed(
      //   "%c[Nuxt Router] Available Routes:",
      //   "color: blue; font-weight: bold;"
      // );
      routes.forEach((route) => {
        // console.log({
        //   name: route.name,
        //   path: route.path,
        //   // Accessing component name can be tricky, might need different approaches
        //   // For Vue components, __name is often set during build in dev mode.
        //   componentName:
        //     (route.components?.default as any)?.__name ||
        //     (typeof route.components?.default === "function"
        //       ? "AsyncComponent"
        //       : route.components?.default
        //       ? String(route.components.default)
        //       : "UnknownComponent"),
        //   meta: route.meta,
        // });
      });
      console.groupEnd();
    } else {
      console.warn(
        "[Nuxt Router] $router instance or getRoutes method not available."
      );
    }
  }
});
