import type { RouterConfig } from "@nuxt/schema";

export default (<RouterConfig>{
  // https://router.vuejs.org/api/interfaces/routeroptions.html#routes
  // routes: (_routes) => [
  //   {
  //     name: "home",
  //     path: "/",
  //     component: () => import("~/pages/home.vue"),
  //   },
  // ],
  scrollBehavior(to, from, savedPosition) {
    // console.log('AVAILABLE ROUTES:', this.getRoutes()); // 'this' refers to the router instance
    return savedPosition || { top: 0, left: 0, behavior: "smooth" };
  },
}) satisfies RouterConfig;
