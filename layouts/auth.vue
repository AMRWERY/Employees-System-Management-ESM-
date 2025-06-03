<template>
  <div>
    <slot />
  </div>
</template>

<script lang="ts" setup>
const localeStore = useLocaleStore();

onMounted(async () => {
  await localeStore.loadLocale();
});
</script>