<template>
  <div>
    <div class="min-h-screen bg-gray-50 p-4 md:p-8 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">{{ formattedDate }}</h2>
          <p class="text-gray-600 text-sm mt-1 flex items-center gap-2">
            You're currently
            <icon name="fxemoji:alarmclock" />
            <span :class="attendanceStore.clockedIn ? 'text-green-600' : 'text-red-600'">
              {{ attendanceStore.clockedIn ? 'Clocked In' : 'Clocked Out' }}
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
          <icon name="fxemoji:alarmclock" />
          {{ attendanceStore.clockedIn ? 'Clock Out' : 'Clock In' }}
        </button>
      </div>

      <!-- Recent History -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Today's Activity</h3>
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
              {{ entry.type === 'in' ? 'Clocked In' : 'Clocked Out' }}
            </span>
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-4">Past Week Summary</h3>
          <div class="grid grid-cols-7 gap-2 text-center">
            <div v-for="day in attendanceStore.weeklySummary" :key="day.date" class="p-2 rounded bg-gray-50 text-sm">
              <div class="text-gray-600 mb-1">{{ day.day }}</div>
              <div v-if="day.hours" class="text-green-600 font-medium">{{ day.hours }}h</div>
              <div v-else class="text-gray-400">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Timestamp } from 'firebase/firestore';

const { t } = useI18n();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
});

onMounted(async () => {
  await attendanceStore.fetchTodayEntries();
  await attendanceStore.fetchWeeklySummary();
});

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const toggleClock = async () => {
  if (attendanceStore.clockedIn) {
    await attendanceStore.clockOut();
  } else {
    await attendanceStore.clockIn();
  }
};

useHead({
  titleTemplate: () => t('head.my_attendance'),
});
</script>