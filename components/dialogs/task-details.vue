<template>
  <div>
    <div id="task-details-modal">
      <div
        class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ task?.title }}</h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="$emit('close')" />
          </div>

          <div class="mt-4">
            <p class="text-slate-600 text-sm leading-relaxed">{{ task?.description }}</p>

            <!-- actions buttons -->
            <div v-if="task?.status !== 'todo'" class="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
              <!-- In Progress -->
              <template v-if="task?.status === 'in-progress'">
                <button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded"
                  @click="$emit('update-status', { id: task.id, status: 'done' })">
                  Mark as Done
                </button>
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded"
                  @click="console.log('Start Time')">
                  Start Time
                </button>
                <button class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded"
                  @click="console.log('End Time')">
                  End Time
                </button>
              </template>

              <!-- Done -->
              <template v-else-if="task?.status === 'done'">
                <button class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded"
                  @click="$emit('update-status', { id: task.id, status: 'in-progress' })">
                  Move to In Progress
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  task: {
    id: number
    title: string
    description: string
    status: string
  } | null
}>()

defineEmits(['close', 'update-status'])
</script>