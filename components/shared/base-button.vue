<template>
  <div>
    <button
      class="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center">
      <slot></slot>
      <slot name="icon">
        <icon v-if="defaultIcon" name="heroicons-solid:plus-sm" class="ms-2 w-5 h-5" />
      </slot>
    </button>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  defaultIcon: {
    type: Boolean,
    default: true
  }
});
</script>