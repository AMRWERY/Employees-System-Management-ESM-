<template>
  <div>
    <main-layout>
      <div class="p-4">
        <slot />
      </div>
    </main-layout>
  </div>
</template>

<script lang="ts" setup>
const localeStore = useLocaleStore();

onMounted(async () => {
  await localeStore.loadLocale();
});
</script>