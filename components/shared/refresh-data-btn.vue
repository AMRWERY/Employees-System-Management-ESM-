<template>
  <div>
    <button @click="handleReload"
      class="flex items-center justify-center p-2 text-gray-600 rounded-full hover:bg-gray-100 shadow border border-gray-300">
      <icon name="flowbite:refresh-outline" />
    </button>
  </div>
</template>

<script lang="ts" setup>
const handleReload = async () => {
  // Simulate API or reload action
  await new Promise((resolve) => setTimeout(resolve, 1500));
};
</script>