<template>
  <div>
    <p>Hello World!</p>

    <!-- dynamic-toast component -->
    <div class="fixed z-50 pointer-events-none bottom-5 start-5 w-96">
      <div class="pointer-events-auto">
        <dynamic-toast v-if="showToast" :message="toastMessage" :toastType="toastType" :duration="5000"
          :toastIcon="toastIcon" @toastClosed="showToast = false" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const authStore = useAuthStore()
const { t } = useI18n()
const { showToast, toastMessage, toastType, toastIcon, triggerToast } = useToast();

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
</script>