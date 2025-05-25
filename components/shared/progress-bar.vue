<template>
  <div>
    <div v-show="isLoading" class="fixed top-0 z-50 w-full h-1 transition-all duration-300 bg-blue-500 start-0"
      :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script setup lang="ts">
const progress = ref(0);
const isLoading = ref(false);
let interval: number;

const router = useRouter();

const startProgress = (): void => {
  progress.value = 0;
  isLoading.value = true;
  interval = window.setInterval(() => {
    if (progress.value < 95) {
      progress.value += Math.random() * 5 + 5;
    }
  }, 2000)
};

const stopProgress = (): void => {
  window.clearInterval(interval);
  progress.value = 100;
  setTimeout(() => {
    isLoading.value = false;
    progress.value = 0;
  }, 1000);
};

onMounted(() => {
  router.beforeEach(() => {
    startProgress();
    return true;
  });
  router.afterEach(() => {
    stopProgress();
  });
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>