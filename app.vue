<template>
  <div>
    <ClientOnly>
      <div class="bg-lightsmoke">
        <NuxtLayout>
          <!-- progress-bar component -->
          <progress-bar />
          
          <!-- breadcrumb component -->
          <breadcrumb v-if="!isHome" class="mb-7" />
          
          <NuxtPage />
        </NuxtLayout>
      </div>
    </ClientOnly>

    <!-- dynamic-toast component -->
    <teleport to='body'>
      <div class="fixed z-[9999] pointer-events-none top-10 start-1/2 -translate-x-1/2 w-full max-w-xs">
        <div class="pointer-events-auto flex justify-center">
          <dynamic-toast v-if="showToast" :message="toastMessage" :toastType="toastType" :duration="toastDuration"
            :toastIcon="toastIcon" @toastClosed="showToast = false" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const isHome = computed(() => route.meta.layout === 'auth' || route.meta.layout === 'dashnoard');

const { showToast, toastMessage, toastType, toastIcon, toastDuration } = useToast()
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

.layout-enter-active,
.layout-leave-active {
  transition: all 0.4s;
}

.layout-enter-from,
.layout-leave-to {
  filter: grayscale(1);
}
</style>