<template>
  <div>
    <div id="task-details-modal">
      <div
        class="fixed inset-0 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div
          class="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 relative overflow-y-auto h-[calc(650px-88px)] hide-scrollbar">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">
              {{ task?.title }}
            </h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="handleClose" />
          </div>

          <div class="my-4 space-y-4">
            <div class="flex items-center justify-between">
              <div v-if="task?.assignedTo" class="flex items-center">
                <img :src="assigneeProfileImg || '/dummy-profile-img.jpg'" alt="employee-profile-img"
                  class="w-8 h-8 rounded-full me-2 border border-gray-400" />
                <span>{{ assigneeName }}</span>
              </div>

              <div class="flex items-center gap-1">
                <icon name="majesticons:comments-2-line" class="text-blue-400 w-5 h-5" />
                <span>{{ totalComments }} {{ t('dashboard.comments') }}</span>
              </div>

              <!--add_tag / remove_tag btn -->
              <div>
                <button class="rounded-full" :title="task?.tagged ? t('btn.remove_tag') : t('btn.add_tag')"
                  @click="toggleTag" :disabled="isTagging">
                  <icon v-if="!isTagging" :name="task?.tagged
                    ? 'material-symbols:bookmark-check-sharp'
                    : 'material-symbols:bookmark-check-outline-sharp'"
                    :class="task?.tagged ? 'text-purple-700' : 'text-gray-400'" />
                  <icon v-else name="svg-spinners:90-ring-with-bg" class="text-purple-700 w-5 h-5" />
                </button>
              </div>

              <div
                :class="{ hidden: task?.status === 'todo' || task?.status === 'cancelled' || task?.status === 'done' }">
                <base-button :default-icon="false" :appendIcon="loading.save ? '' : 'material-symbols:save-rounded'"
                  :type="'button'" :loading="loading.save" :title="t('btn.save_close')" :textColor="'text-white'"
                  :hover-color="'hover:bg-blue-800'" variant="solid" @click="handleMarkAsDone">
                  <icon name="svg-spinners:90-ring-with-bg" class="h-5 w-5" v-if="loading.save" />
                  <div v-else>
                    <span>{{ t('btn.save_close') }}</span>
                  </div>
                </base-button>
              </div>
            </div>

            <div
              class="border border-gray-150 rounded-lg shadow p-3 text-white bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#1d5464] via-[#207e82] to-[#298f9b] flex items-center gap-20">
              <div v-if="task?.priority" class="space-s-1.5">
                <strong>{{ t("form.priority") }}:</strong>
                <span>{{ t(`priorities.${task.priority}`) }}</span>
              </div>

              <div v-if="task?.status" class="space-s-1.5">
                <strong>{{ t("form.status") }}:</strong>
                <span>{{ t(`status.${task.status}`) }}</span>
              </div>
            </div>

            <div
              class="border border-gray-150 rounded-lg shadow p-3 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-[#d5def5] via-[#8594e4] to-[#6643b5]">
              <p class="mb-2">{{ t('dashboard.description') }}</p>
              <span class="text-slate-600 text-sm leading-relaxed">
                {{ task?.description }}
              </span>
            </div>

            <div v-if="task?.status === 'in-progress' || task?.status === 'done'">
              <p>{{ t("dashboard.elapsed_time") }} {{ formattedTime }}</p>
            </div>

            <div class="relative">
              <text-editor v-model="content" />
              <base-button :default-icon="false" class="absolute bottom-2 end-2" @click="submitComment">
                {{ t('btn.comment') }}
              </base-button>
            </div>

            <div>
              <!-- comments component -->
              <comments :comments="commentsStore.comments" />
            </div>

            <!-- base-button component-->
            <base-button :default-icon="false" :link="true" @click="$emit('edit-task', task)"
              v-if="task?.status !== 'done'">
              {{ t("btn.edit") }}
            </base-button>
          </div>

          <!-- actions buttons -->
          <div v-if="task?.status !== 'todo'" class="flex flex-wrap pt-2 border-t border-gray-200 gap-2">
            <!-- In Progress -->
            <template v-if="task?.status === 'in-progress'">
              <!-- base-button component-->
              <base-button :default-icon="false" :appendIcon="loading.done ? '' : 'mdi:checkbox-marked-circle-outline'"
                :type="'button'" :loading="loading.done" :textColor="'text-white'" :bg-color="'bg-green-700'"
                :hover-color="'hover:bg-green-800'" :variant="'solid'" v-if="isEnded" @click="handleMarkAsDone">
                <icon name="svg-spinners:90-ring-with-bg" class="h-5 w-5" v-if="loading.done" />
                <div v-else>
                  <span>{{ t('btn.done') }}</span>
                </div>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" :appendIcon="loading.start ? '' : 'icon-park-outline:stopwatch-start'"
                :type="'button'" :loading="loading.start" :textColor="'text-white'" :bg-color="'bg-blue-700'"
                :hover-color="'hover:bg-blue-800'" :variant="'solid'" v-if="!isStarted && !isEnded"
                @click="handleStartTimer">
                <icon name="svg-spinners:90-ring-with-bg" class="h-5 w-5" v-if="loading.start" />
                <div v-else>
                  <span>{{ t('btn.start_time') }}</span>
                </div>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false" :appendIcon="loading.end ? '' : 'octicon:stopwatch-16'"
                :type="'button'" :loading="loading.end" :textColor="'text-white'" :bg-color="'bg-red-700'"
                :hover-color="'hover:bg-red-800'" :variant="'solid'" v-if="isStarted || isPaused"
                @click="handleEndTimer">
                <icon name="svg-spinners:90-ring-with-bg" class="h-5 w-5" v-if="loading.end" />
                <div v-else>
                  <span>{{ t('btn.end_time') }}</span>
                </div>
              </base-button>

              <!-- base-button component-->
              <base-button :default-icon="false"
                :appendIcon="loading.pause ? '' : (isPaused ? 'mdi:play-circle-outline' : 'mdi:pause-circle-outline')"
                :type="'button'" :loading="loading.pause" :textColor="'text-white'" :bg-color="'bg-indigo-700'"
                :hover-color="'hover:bg-indigo-800'" :variant="'solid'" v-if="isStarted && !isEnded"
                @click="handleTogglePause">
                <icon name="svg-spinners:90-ring-with-bg" class="h-5 w-5" v-if="loading.pause" />
                <div v-else>
                  <span>{{
                    isPaused ? t('btn.resume') : t('btn.pause')
                  }}</span>
                </div>
              </base-button>
            </template>

            <!-- Done -->
            <template v-else-if="task?.status === 'done'">
              <!-- base-button component-->
              <base-button :default-icon="false" :appendIcon="loading.inProgress ? '' : 'mdi:close-octagon-outline'"
                :type="'button'" :loading="loading.inProgress" :textColor="'text-white'" :bg-color="'bg-purple-700'"
                :hover-color="'hover:bg-purple-800'" :variant="'solid'" @click="handleMoveToInProgress">
                <icon name="svg-spinners:90-ring-with-bg" class="h-5 w-5" v-if="loading.inProgress" />
                <div v-else>
                  <span>{{ t('btn.back_to_in_progress') }}</span>
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
import type { Task } from "@/types/task-management";

const { t } = useI18n();
const employeesStore = useEmployeesStore();
const authStore = useAuthStore();
const taskStore = useTaskManagementStore()
const { triggerToast } = useToast();

const props = defineProps<{
  task: Task | null;
}>();

const emit = defineEmits([
  "close",
  "update-status",
  "update-time",
  "edit-task",
]);

const loading = ref({
  save: false,
  done: false,
  start: false,
  end: false,
  pause: false,
  inProgress: false,
});

const loadingTimeOut = 2000;

const setLoading = (key: keyof typeof loading.value, value: boolean) => {
  loading.value[key] = value;
};

const isStarted = ref(false);
const isPaused = ref(false);
const isEnded = ref(false);
const elapsedTime = ref(props.task?.elapsedTime || 0);

const timerKey = computed(() =>
  props.task ? `timer_${props.task.id}` : ''
);

let timerInterval: NodeJS.Timeout | null = null;

const startTimerInterval = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value++;
    if (props.task) {
      emit("update-time", { id: props.task.id, elapsedTime: elapsedTime.value });
    }
  }, 1000);
};

const saveTimerState = () => {
  if (!timerKey.value) return;
  localStorage.setItem(timerKey.value, JSON.stringify({
    startTime: isStarted.value && !isPaused.value ? Date.now() : null,
    isPaused: isPaused.value,
    elapsed: elapsedTime.value
  }));
};

const clearTimerState = () => {
  if (timerKey.value) {
    localStorage.removeItem(timerKey.value);
  }
};

const formattedTime = computed(() => {
  const totalSeconds = elapsedTime.value;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
});

const handleClose = () => {
  saveTimerState();
  emit("close");
};

const handleMarkAsDone = async () => {
  if (!props.task) return;
  setLoading("done", true);
  setLoading("save", true);
  clearTimerState();
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  await promiseTimeout(loadingTimeOut);
  setLoading("done", false);
  setLoading("save", false);
  emit("update-status", {
    id: props.task.id,
    status: "done",
    elapsedTime: elapsedTime.value,
  });
};

const handleMoveToInProgress = async () => {
  if (!props.task) return;
  setLoading("inProgress", true);
  clearTimerState();
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  elapsedTime.value = 0;
  isStarted.value = false;
  isPaused.value = false;
  isEnded.value = false;
  emit("update-time", { id: props.task.id, elapsedTime: 0 });
  await promiseTimeout(loadingTimeOut);
  setLoading("inProgress", false);
  emit("update-status", { id: props.task.id, status: "in-progress" });
};

const handleStartTimer = async () => {
  if (!props.task) return;
  setLoading("start", true);
  await promiseTimeout(loadingTimeOut);
  setLoading("start", false);
  isStarted.value = true;
  isPaused.value = false;
  isEnded.value = false;
  if (!props.task.elapsedTime || isEnded.value) {
    elapsedTime.value = 0;
  }
  startTimerInterval();
  saveTimerState();
};

const handleEndTimer = async () => {
  if (!props.task) return;
  setLoading("end", true);
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  clearTimerState();
  emit("update-time", { id: props.task.id, elapsedTime: elapsedTime.value });
  await promiseTimeout(loadingTimeOut);
  setLoading("end", false);
  isStarted.value = false;
  isPaused.value = false;
  isEnded.value = true;
};

const handleTogglePause = async () => {
  setLoading("pause", true);
  if (isPaused.value) {
    isPaused.value = false;
    startTimerInterval();
  } else {
    // Pausing
    isPaused.value = true;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    emit("update-time", { id: props.task?.id, elapsedTime: elapsedTime.value });
  }

  saveTimerState();
  await promiseTimeout(loadingTimeOut);
  setLoading("pause", false);
};

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      elapsedTime.value = newTask.elapsedTime || 0;
      isStarted.value = false;
      isPaused.value = false;
      isEnded.value = false;
      const saved = timerKey.value ? localStorage.getItem(timerKey.value) : null;
      if (saved) {
        const { startTime, isPaused: paused } = JSON.parse(saved);

        if (startTime) {
          const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
          elapsedTime.value += currentElapsed;
          isStarted.value = true;
          startTimerInterval();
        } else if (paused) {
          // Timer was paused
          isStarted.value = true;
          isPaused.value = true;
        }
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

const formatName = (user: any) => {
  if (!user) return "";
  const parts = [];
  if (user.firstName) parts.push(user.firstName);
  if (user.middleName) parts.push(user.middleName);
  if (user.lastName) parts.push(user.lastName);
  return parts.join(" ");
};

const assigneeProfileImg = computed(() => {
  if (!props.task?.assignedTo) return "";
  const user = employeesStore.allUsers.find(
    (u) => u.id === props.task?.assignedTo
  );
  if (user && user.profileImg) {
    return user.profileImg;
  }
  if (props.task?.assignedTo === authStore.user?.uid && authStore.user?.photoURL) {
    return authStore.user.photoURL;
  }
  return "";
});

const assigneeName = computed(() => {
  if (!props.task?.assignedTo) return "";
  // Try to find the user
  const user = employeesStore.allUsers.find(
    (u) => u.id === props.task?.assignedTo
  );
  // If found, return formatted name
  if (user) {
    return formatName(user);
  }
  // Check if it's the current user
  if (props.task?.assignedTo === authStore.user?.uid) {
    return t("form.assign_to_me");
  }
  return;
});

const isTagging = ref(false)

const toggleTag = async () => {
  if (!props.task) return;
  isTagging.value = true;
  const newTaggedState = !props.task.tagged;
  props.task.tagged = newTaggedState;
  await taskStore.updateTask(props.task.id, {
    tagged: newTaggedState
  });
  await promiseTimeout(2000);
  isTagging.value = false;
  triggerToast({
    message: t(newTaggedState ? 'toast.tag_added' : 'toast.tag_removed'),
    type: 'success',
    icon: 'mdi-check-circle',
  });
};

const commentsStore = useCommentsStore();
const content = ref('');
const taskId = props.task?.id;

// Fetch when task changes
watch(() => taskId, (id) => {
  if (id) commentsStore.fetchComments(id);
}, { immediate: true });

// Submit new comment or self-reply
const submitComment = async () => {
  if (!content.value.trim() || !taskId) return;
  await commentsStore.addCommentOrReply(taskId, content.value.trim());
  content.value = '';
};

const totalComments = computed(() => {
  const comments = commentsStore.comments;
  if (!comments.length) return 0;
  const mainComments = comments.length;
  const replies = comments.reduce((total, comment) => {
    return total + (comment.replies?.length || 0);
  }, 0);
  return mainComments + replies;
});
</script>