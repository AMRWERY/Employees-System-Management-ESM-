<template>
  <div>
    <div id="task-details-modal">
      <div
        class="fixed inset-0 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-4 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ task?.title }}</h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="handleClose" />
          </div>

          <div class="my-4 space-y-4">
            <p class="text-slate-600 text-sm leading-relaxed">{{ task?.description }}</p>

            <div v-if="task?.status === 'in-progress' || task?.status === 'done'">
              <p>{{ t('dashboard.elapsed_time') }} {{ formattedTime }}</p>
            </div>

            <!-- base-button component-->
            <base-button :default-icon="false" :link="true" @click="$emit('edit-task', task)"
              v-if="task?.status !== 'done'">
              {{ t('btn.edit') }}
            </base-button>
          </div>

          <!-- actions buttons -->
          <div v-if="task?.status !== 'todo'" class="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
            <!-- In Progress -->
            <template v-if="task?.status === 'in-progress'">
              <!-- base-button component-->
              <base-button :default-icon="false" type="button" :loading="loading.done"
                :hover-color="'hover:bg-green-400'" variant="outline" @click="handleMarkAsDone">
                <icon name="svg-spinners:90-ring-with-bg" v-if="loading.done" />
                <span v-else>{{ t('btn.done') }}</span>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" type="button" :loading="loading.start"
                :hover-color="'hover:bg-blue-400'" variant="outline" v-if="!isStarted" @click="handleStartTimer">
                <icon name="svg-spinners:90-ring-with-bg" v-if="loading.start" />
                <span v-else>{{ t('btn.start_time') }}</span>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" type="button" :loading="loading.end"
                :hover-color="'hover:bg-purple-400'" variant="outline" v-else @click="handleEndTimer">
                <icon name="svg-spinners:90-ring-with-bg" v-if="loading.end" />
                <span v-else>{{ t('btn.end_time') }}</span>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" type="button" :loading="loading.pause"
                :hover-color="'hover:bg-blue-400'" variant="outline" v-if="isStarted" @click="handleTogglePause">
                <icon name="svg-spinners:90-ring-with-bg" v-if="loading.pause" />
                <span v-else>{{ isPaused ? t('btn.resume') : t('btn.pause') }}</span>
              </base-button>
            </template>

            <!-- Done -->
            <template v-else-if="task?.status === 'done'">
              <!-- base-button component-->
              <base-button :default-icon="false" type="button" :loading="loading.inProgress"
                :hover-color="'hover:bg-yellow-400'" variant="outline" @click="handleMoveToInProgress">
                <icon name="svg-spinners:90-ring-with-bg" v-if="loading.inProgress" />
                <span v-else>{{ t('btn.move_to_in_progress') }}</span>
              </base-button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

const props = defineProps<{
  task: {
    id: number
    title: string
    description: string
    status: string
    elapsedTime: number
  } | null
}>()

const emit = defineEmits(['close', 'update-status', 'update-time', 'edit-task'])

const loading = ref({
  done: false,
  start: false,
  end: false,
  pause: false,
  inProgress: false,
})

const loadingTimeOut = 2000

const setLoading = (key: keyof typeof loading.value, value: boolean) => {
  loading.value[key] = value
}

const count = shallowRef(0)

async function fetchData() {
  // await promiseTimeout(1000)
  // count.value++
  await promiseTimeout(1000)
  if (props.task) {
    emit('update-time', { id: props.task.id, elapsedTime: props.task.elapsedTime + 1 })
  }
}

const { pause, resume } = useTimeoutPoll(fetchData, 1000)

const isStarted = ref(false)
const isPaused = ref(false)

const formattedTime = computed(() => {
  const totalSeconds = props.task?.elapsedTime || 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
})

const handleClose = async () => {
  emit('close')
}

const handleMarkAsDone = async () => {
  if (!props.task) return
  setLoading('done', true)
  await promiseTimeout(loadingTimeOut)
  setLoading('done', false)
  emit('update-status', { id: props.task.id, status: 'done' })
}

const handleMoveToInProgress = async () => {
  if (!props.task) return
  setLoading('inProgress', true)
  await promiseTimeout(loadingTimeOut)
  setLoading('inProgress', false)
  emit('update-status', { id: props.task.id, status: 'in-progress' })
}

const handleStartTimer = async () => {
  setLoading('start', true)
  await promiseTimeout(loadingTimeOut)
  setLoading('start', false)
  isStarted.value = true
  isPaused.value = false
  resume()
}

const handleEndTimer = async () => {
  setLoading('end', true)
  await promiseTimeout(loadingTimeOut)
  setLoading('end', false)
  isStarted.value = false
  isPaused.value = false
  pause()
  count.value = 0
}

const handleTogglePause = async () => {
  setLoading('pause', true)
  await promiseTimeout(loadingTimeOut)
  setLoading('pause', false)
  if (isPaused.value) {
    resume()
  } else {
    pause()
  }
  isPaused.value = !isPaused.value
}

watch(
  () => props.task,
  (newTask) => {
    if (newTask?.status === 'in-progress' && isStarted.value && !isPaused.value) {
      resume()
    } else {
      pause()
    }
  },
  { immediate: true }
)
</script>