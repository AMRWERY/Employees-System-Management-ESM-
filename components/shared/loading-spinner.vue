<template>
  <div>
    <div role="status" class="flex justify-center items-center">
      <icon name="svg-spinners:270-ring-with-bg" :class="[sizeClass, color]" />
      <span class="sr-only">Loading...</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  size: {
    type: String,
    default: 'md',
  },
  color: {
    type: String,
    default: 'text-blue-600',
  },
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-6 w-6';
    case 'lg':
      return 'h-12 w-12';
    case 'xl':
      return 'h-16 w-16';
    case 'md':
    default:
      return 'h-8 w-8';
  }
});
</script>