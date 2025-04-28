<template>
  <div>
    <transition name="overlay-fade">
      <div v-if="visible" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-75">
        <div class="flex items-center justify-center">
          <div class="flex justify-center text-5xl text-gray-300 align-center">
            <icon name="svg-spinners:pulse-rings-multiple" class="w-64 h-64" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
defineProps(['visible']);
</script>

<style scoped>
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.5s;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.overlay-fade-enter-to,
.overlay-fade-leave-from {
  opacity: 1;
}
</style>