<template>
  <div>
    <div class="min-h-screen bg-gray-50 p-4 md:p-8 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">{{ formattedDate }}</h2>
          <p class="text-gray-600 text-sm mt-1 flex items-center gap-2">
            {{ $t('dashboard.you_re_currently') }}
            <icon name="fxemoji:alarmclock" />
            <span
              :class="attendanceStore.clockedIn ? 'text-green-600 underline font-semibold' : 'text-red-600 underline font-semibold'">
              {{ attendanceStore.clockedIn ? t('dashboard.clocked_in') : t('dashboard.clocked_out') }}
            </span>
          </p>
        </div>
      </div>

      <!-- Big Action Button -->
      <div class="flex justify-center mb-8">
        <button @click="toggleClock" :disabled="attendanceStore.loading" :class="[
          'py-6 px-12 rounded-lg text-2xl font-bold transition-all flex items-center justify-center gap-2',
          attendanceStore.clockedIn
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white',
          attendanceStore.loading ? 'opacity-50 cursor-not-allowed' : ''
        ]">
          <template v-if="isProcessing">
            <icon name="svg-spinners:270-ring" class="w-8 h-8" />
          </template>
          <template v-else>
            <icon name="fxemoji:alarmclock" />
            {{ attendanceStore.clockedIn ? t('btn.clocked_out') : t('btn.clocked_in') }}
          </template>
        </button>
      </div>

      <!-- Recent History -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">{{ $t('dashboard.todays_activity') }}</h3>
        <div class="space-y-3">
          <div v-for="(entry, index) in attendanceStore.formattedTodayEntries" :key="index"
            class="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div class="flex flex-col">
              <span class="text-gray-600">{{ formatTime(entry.time) }}</span>
              <span v-if="entry.clockOut" class="text-sm text-gray-500">
                {{ formatTime(entry.clockOut) }}
              </span>
            </div>

            <span :class="[
              'px-3 py-1 rounded-full text-sm',
              entry.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]">
              {{ entry.type === 'in' ? t('dashboard.clocked_in') : t('dashboard.clocked_out') }}
            </span>
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-4">{{ $t('dashboard.past_week_summary') }}</h3>
          <div class="grid grid-cols-7 gap-2 text-center">
            <div v-for="day in attendanceStore.weeklySummary" :key="day.date" class="p-2 rounded bg-gray-50 text-sm">
              <div class="text-gray-600 mb-1">{{ day.day }}</div>
              <div v-if="day.totalSeconds" class="text-green-600 font-medium">{{ formatDuration(day.totalSeconds) }}h
              </div>
              <div v-else class="text-gray-400">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- dynamic-toast component -->
    <div class="fixed z-50 pointer-events-none bottom-5 end-1 w-96">
      <div class="pointer-events-auto">
        <dynamic-toast v-if="showToast" :message="toastMessage" :toastType="toastType" :duration="5000"
          :toastIcon="toastIcon" @toastClosed="showToast = false" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const attendanceStore = useAttendanceStore();
const { showToast, toastMessage, toastType, toastIcon, triggerToast } = useToast();

onMounted(async () => {
  await attendanceStore.fetchTodayRecord();
  await attendanceStore.fetchWeeklySummary();
});

const dayLocale = localStorage.getItem('locale') || 'en-US';

const formattedDate = useDateFormat(useNow(), 'YYYY-MM-DD (dddd)', { locales: dayLocale });

const formatTime = (date: Date) => {
  return useDateFormat(date, 'HH:mm a');
};

// In component script
const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
};

const isProcessing = ref(false);

const toggleClock = async () => {
  try {
    isProcessing.value = true;
    if (attendanceStore.clockedIn) {
      await attendanceStore.clockOut();
      triggerToast({
        message: t('toast.successfully_check_out'),
        type: 'success',
        icon: 'mdi-check-circle',
      });
    } else {
      await attendanceStore.clockIn();
      triggerToast({
        message: t('toast.successfully_check_in'),
        type: 'success',
        icon: 'mdi-check-circle',
      });
    }
    setTimeout(() => {
      isProcessing.value = false;
    }, 3000);
  } catch (error) {
    isProcessing.value = false;
    triggerToast({
      message: t('toast.something_wrong'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  }
};

useHead({
  titleTemplate: () => t('head.my_attendance'),
});
</script>