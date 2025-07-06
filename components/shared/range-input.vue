<template>
  <div>
    <div v-for="(value, key) in ratings" :key="key" class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700 capitalize">
        {{ t(`form.${key}`) }}
      </label>
      <div class="flex items-center gap-2 w-48">
        <input type="range" min="1" max="5" v-model.number="ratings[key]"
          class="block w-48 py-2 mt-2 text-gray-700 bg-white rounded-md accent-blue-700" />
        <span class="text-sm font-medium w-6 text-center">
          {{ ratings[key] }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

defineProps<{
  ratings: Record<string, number>
}>()
</script>