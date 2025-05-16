<template>
  <div>
    <div v-if="show"
      class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
      <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
        <button @click="closeModal" class="absolute top-4 end-4">
          <icon name="material-symbols:close-small-rounded" class="w-6 h-6 text-gray-400 hover:text-red-500" />
        </button>

        <div class="my-6 text-center">
          <icon name="mdi:delete-outline" class="w-20 h-20 text-red-500 mx-auto" />
          <h4 class="text-slate-900 text-base font-medium mt-4">{{ title }}</h4>
          <p class="text-gray-600 mt-2" v-if="message">{{ message }}</p>

          <div class="text-center space-s-4 mt-10">
            <button @click="closeModal" type="button"
              class="px-5 py-2.5 rounded-lg text-slate-900 text-sm font-medium bg-gray-200 hover:bg-gray-300 active:bg-gray-200">
              {{ cancelText }}
            </button>
            <button @click="confirmDelete" type="button"
              :class="['px-5 py-2.5 rounded-lg text-white text-sm font-medium', loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:bg-red-600']"
              :disabled="loading">
              <icon v-if="loading" name="svg-spinners:270-ring" class="w-5 h-5 inline" />
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  show: boolean
  title?: string
  message?: string
  cancelText?: string
  confirmText?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

function closeModal() {
  emit('close')
}

function confirmDelete() {
  emit('confirm')
}
</script>