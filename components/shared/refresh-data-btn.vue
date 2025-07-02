<template>
  <div>
    <button @click="handleReload" :disabled="isLoading"
      class="flex items-center justify-center p-2 text-gray-600 rounded-full bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow border border-gray-300">
      <icon v-if="!isLoading" name="flowbite:refresh-outline" class="w-5 h-5" />
      <icon v-else name="svg-spinners:90-ring-with-bg" class="w-5 h-5 animate-spin" />
    </button>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  isLoading?: boolean;
}>();

const emit = defineEmits(['refresh']);

const handleReload = () => {
  if (!props.isLoading) {
    emit('refresh');
  }
};
</script>