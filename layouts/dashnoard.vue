<template>
  <div>
    <main-layout>
      <div class="p-4">
        <slot />
      </div>
    </main-layout>

    <!-- Birthday dialog component -->
    <birthdate-dialog v-if="showBirthdayDialog" @close="closeBirthdayDialog" />
  </div>
</template>

<script lang="ts" setup>
const localeStore = useLocaleStore();
const authStore = useAuthStore();
const showBirthdayDialog = ref(false);

onMounted(async () => {
  await localeStore.loadLocale();
  // Only show birthday dialog once per session for authenticated users
  const birthdayShown = sessionStorage.getItem('birthdayShown');
  if (!birthdayShown && authStore.user) {
    showBirthdayDialog.value = true;
    sessionStorage.setItem('birthdayShown', 'true');
  }
});

const closeBirthdayDialog = () => {
  showBirthdayDialog.value = false;
};
</script>