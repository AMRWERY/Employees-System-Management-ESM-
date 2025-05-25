<template>
  <div>
    <div class="mx-auto max-w-7xl">
      <nav class="flex" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-s-1 md:space-s-2 rtl:space-s-reverse">
          <li class="inline-flex items-center">
            <nuxt-link-locale to="/" class="inline-flex items-center text-sm font-medium text-gray-700 ">
              <icon name="material-symbols:home-outline-rounded" class="w-5 h-5 me-2.5" />
              {{ t('breadcrumb.home') }}
            </nuxt-link-locale>
          </li>
          <li v-if="breadcrumbLabel">
            <div class="flex items-center">
              <icon name="material-symbols:arrow-forward-ios-rounded"
                class="w-3 h-3 mx-1 text-gray-700 rtl:rotate-180" />
              <nuxt-link to="" class="text-sm font-medium text-gray-700 ms-1">{{
                breadcrumbLabel }}</nuxt-link>
            </div>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
const { t } = useI18n();

const breadcrumbLabel = computed(() => {
  if (route.meta?.breadcrumb) {
    return t(`breadcrumb.${route.meta.breadcrumb}`);
  }
  if (route.name) {
    // Handle both string and symbol cases
    const routeName = typeof route.name === 'string' ?
      route.name :
      route.name.toString();

    // Split route name to remove locale suffix
    const [baseRouteName] = routeName.split('___');
    const formattedName = baseRouteName
      .replace(/-/g, '_')
      .toLowerCase();
    return t(`breadcrumb.${formattedName}`);
  }
  const pathSegments = route.path.split('/');
  return pathSegments[pathSegments.length - 1] || 'Unknown';
});
</script>