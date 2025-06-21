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
            <div class="border border-gray-150 rounded-lg shadow p-3 bg-gray-100">
              <p class="text-slate-600 text-sm leading-relaxed">{{ task?.description }}</p>
            </div>

            <div class="space-y-1 text-sm text-slate-600">
              <div v-if="task?.priority" class="space-s-1.5">
                <strong class="text-slate-900">{{ t('form.priority') }}:</strong>
                <span>{{ t(`priorities.${task.priority}`) }}</span>
              </div>

              <div v-if="task?.status" class="space-s-1.5">
                <strong class="text-slate-900">{{ t('form.status') }}:</strong>
                <span>{{ t(`status.${task.status}`) }}</span>
              </div>

              <div v-if="task?.assignedTo" class="space-s-1.5">
                <strong class="text-slate-900">{{ t('form.assign_to') }}:</strong>
                <span>{{ assigneeName }}</span>
              </div>
            </div>

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
          <div v-if="task?.status !== 'todo'" class="flex flex-wrap pt-2 border-t border-gray-200">
            <!-- In Progress -->
            <template v-if="task?.status === 'in-progress'">
              <!-- base-button component-->
              <base-button :default-icon="false" :no-border="true" type="button" :loading="loading.done"
                :title="t('btn.done')" :hover-color="'hover:bg-green-400'" variant="outline" v-if="isEnded"
                @click="handleMarkAsDone">
                <icon name="svg-spinners:90-ring-with-bg" class="text-green-600 hover:text-green-700 h-6 w-6"
                  v-if="loading.done" />
                <div v-else>
                  <icon name="mdi:checkbox-marked-circle-outline" class="text-green-600 hover:text-green-700 h-6 w-6" />
                  <span class="sr-only">Mark as done</span>
                </div>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" :no-border="true" type="button" :loading="loading.start"
                :title="t('btn.start_time')" :hover-color="'hover:bg-blue-400'" variant="outline"
                v-if="!isStarted && !isEnded" @click="handleStartTimer">
                <icon name="svg-spinners:90-ring-with-bg" class="text-blue-600 hover:text-blue-700 h-6 w-6"
                  v-if="loading.start" />
                <div v-else>
                  <icon name="icon-park-outline:stopwatch-start" class="text-blue-600 hover:text-blue-700 h-6 w-6" />
                  <span class="sr-only">Start time</span>
                </div>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" :no-border="true" type="button" :loading="loading.end"
                :title="t('btn.end_time')" :hover-color="'hover:bg-purple-400'" variant="outline"
                v-if="isStarted || isPaused" @click="handleEndTimer">
                <icon name="svg-spinners:90-ring-with-bg" class="text-red-600 hover:text-red-700 h-6 w-6"
                  v-if="loading.end" />
                <div v-else>
                  <icon name="octicon:stopwatch-16" class="text-red-600 hover:text-red-700 h-6 w-6" />
                  <span class="sr-only">End time</span>
                </div>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" :no-border="true" type="button" :loading="loading.pause"
                :title="isPaused ? t('btn.resume') : t('btn.pause')" :hover-color="'hover:bg-blue-400'"
                variant="outline" v-if="isStarted && !isEnded" @click="handleTogglePause">
                <icon name="svg-spinners:90-ring-with-bg" class="text-indigo-600 hover:text-indigo-700 h-6 w-6"
                  v-if="loading.pause" />
                <div v-else>
                  <icon :name="isPaused ? 'mdi:play-circle-outline' : 'mdi:pause-circle-outline'"
                    class="text-indigo-600 hover:text-indigo-700 h-6 w-6" />
                  <span class="sr-only">{{ isPaused ? 'Resume' : 'Pause' }}</span>
                </div>
              </base-button>
            </template>

            <!-- Done -->
            <template v-else-if="task?.status === 'done'">
              <!-- base-button component-->
              <base-button :default-icon="false" :no-border="true" type="button" :loading="loading.inProgress"
                :title="t('btn.back_to_in_progress')" :hover-color="'hover:bg-yellow-400'" variant="outline"
                @click="handleMoveToInProgress">
                <icon name="svg-spinners:90-ring-with-bg" class="text-purple-600 hover:text-purple-700 h-6 w-6"
                  v-if="loading.inProgress" />
                <div v-else>
                  <icon name="mdi:close-octagon-outline" class="text-purple-600 hover:text-purple-700 h-6 w-6" />
                  <span class="sr-only">back to in progress</span>
                </div>
              </base-button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Task } from '@/types/task-management'

const { t } = useI18n()
const employeesStore = useEmployeesStore()
const authStore = useAuthStore()

const props = defineProps<{
  task: Task | null
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

const elapsedTime = ref(props.task?.elapsedTime || 0)

async function fetchData() {
  await promiseTimeout(1000)
  elapsedTime.value++
  if (props.task) {
    emit('update-time', { id: props.task.id, elapsedTime: elapsedTime.value })
  }
}

const { pause, resume } = useTimeoutPoll(
  fetchData,
  1000,
  { immediate: false }
)

const isStarted = ref(false)
const isPaused = ref(false)
const isEnded = ref(false)

const formattedTime = computed(() => {
  const totalSeconds = elapsedTime.value
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
  emit('update-status', {
    id: props.task.id,
    status: 'done',
    elapsedTime: elapsedTime.value // Ensure latest time is saved
  })
}

const handleMoveToInProgress = async () => {
  if (!props.task) return
  setLoading('inProgress', true)
  elapsedTime.value = 0
  isStarted.value = false
  isPaused.value = false
  isEnded.value = false
  emit('update-time', { id: props.task.id, elapsedTime: 0 })
  await promiseTimeout(loadingTimeOut)
  setLoading('inProgress', false)
  emit('update-status', { id: props.task.id, status: 'in-progress' })
}

const handleStartTimer = async () => {
  if (!props.task) return
  setLoading('start', true)
  await promiseTimeout(loadingTimeOut)
  setLoading('start', false)
  isStarted.value = true
  isPaused.value = false
  isEnded.value = false
  if (!props.task.elapsedTime || isEnded.value) {
    elapsedTime.value = 0
  }
  resume()
}

const handleEndTimer = async () => {
  if (!props.task) return
  setLoading('end', true)
  emit('update-time', { id: props.task.id, elapsedTime: elapsedTime.value })
  await promiseTimeout(loadingTimeOut)
  setLoading('end', false)
  isStarted.value = false
  isPaused.value = false
  isEnded.value = true
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
    if (newTask) {
      elapsedTime.value = newTask.elapsedTime || 0
      // Reset states when task changes
      isStarted.value = false
      isPaused.value = false
      isEnded.value = false
      // Only set started state if task has existing elapsed time
      if (newTask.elapsedTime > 0) {
        isStarted.value = true
      }
    }
  },
  { immediate: true, deep: true }
)

const formatName = (user: any) => {
  if (!user) return ''
  const parts = []
  if (user.firstName) parts.push(user.firstName)
  if (user.middleName) parts.push(user.middleName)
  if (user.lastName) parts.push(user.lastName)
  return parts.join(' ')
}

const assigneeName = computed(() => {
  if (!props.task?.assignedTo) return ''
  // Try to find the user
  const user = employeesStore.allUsers.find(
    u => u.id === props.task?.assignedTo
  )
  // If found, return formatted name
  if (user) {
    return formatName(user)
  }
  // Check if it's the current user
  if (props.task?.assignedTo === authStore.user?.uid) {
    return t('form.assign_to_me')
  }
  return
})
</script>