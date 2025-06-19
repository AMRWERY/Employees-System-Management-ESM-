<template>
  <div>
    <div id="task-modal" v-if="visible">
      <div
        class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">
              {{ task ? t('dashboard.edit_task') : t('dashboard.add_task') }}
            </h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="$emit('close')" />
          </div>

          <div class="my-6">
            <p class="text-slate-600 text-sm leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing
              elit. Sed auctor auctor arcu,
              at fermentum dui. Maecenas Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed auctor
              auctor arcu,
              at fermentum dui. Maecenas.</p>
            <p class="text-slate-600 text-sm leading-relaxed mt-2">Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. Sed auctor auctor arcu,
              at fermentum dui. Maecenas Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed auctor
              auctor arcu,
              at fermentum dui. Maecenas.</p>
            <p class="text-slate-600 text-sm leading-relaxed mt-2">Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. Sed auctor auctor arcu,
              at fermentum dui. Maecenas Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed auctor
              auctor arcu,
              at fermentum dui. Maecenas.</p>
          </div>

          <div class="border-t border-gray-300 pt-6 flex justify-end gap-4">
            <base-button :default-icon="false" type="submit" :disabled="loading">
              {{ task ? t('btn.update') : t('btn.add') }}
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Task } from '@/types/task-management'

const { t } = useI18n()
const { isLoading: loading, startLoading } = useLoading(3000)

defineProps<{
  task?: Task | null
  visible: boolean
}>()

defineEmits(['close', 'submit'])
</script>