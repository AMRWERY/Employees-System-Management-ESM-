<template>
  <div>
    <p>Hello World!</p>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const authStore = useAuthStore()
const { triggerToast } = useToast();

onMounted(() => {
  if (authStore.welcomeType) {
    const message = authStore.welcomeType === 'signup'
      ? t('toast.welcome_new_user')
      : t('toast.welcome_back');
    const icon = authStore.welcomeType === 'signup'
      ? 'mdi:party-popper'
      : 'mdi:hand-wave';
    triggerToast({
      message,
      type: 'success',
      icon,
      // duration: 3000
    });

    authStore.clearWelcomeType();
  }
})

definePageMeta({
  layout: 'dashnoard'
});
</script>