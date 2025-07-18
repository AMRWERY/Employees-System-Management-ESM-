<template>
  <div>
    <button @click="goBack"
      class="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow transition-all duration-200">
      <span>{{ t('btn.back') }}</span>
      <icon name="material-symbols-light:arrow-back-rounded" class="h-5 w-5 ltr:rotate-180" />
    </button>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/') // fallback to home if no history
  }
}
</script>