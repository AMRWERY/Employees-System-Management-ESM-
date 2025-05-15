<template>
  <div>
    <div class="min-h-screen bg-gray-50 p-4 md:p-8 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">{{ formattedDate }}</h2>
          <p class="text-gray-600 text-sm mt-1 flex items-center gap-2">
            {{ t('dashboard.you_re_currently') }}
            <icon name="fxemoji:alarmclock" />
            <span :class="attendanceStore.clockedIn ? 'text-green-600 underline font-semibold' : 'text-red-600 underline font-semibold'">
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
        <h3 class="text-lg font-semibold mb-4">{{ t('dashboard.todays_activity') }}</h3>
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
          <h3 class="text-lg font-semibold mb-4">{{ t('dashboard.past_week_summary') }}</h3>
          <div class="grid grid-cols-7 gap-2 text-center">
            <div v-for="day in attendanceStore.weeklySummary" :key="day.date" 
                 class="p-2 rounded" 
                 :class="day.totalSeconds > 0 ? 'bg-green-50' : 'bg-gray-50'">
              <div class="text-gray-600 mb-1">{{ t(`days.${day.day.toLowerCase()}`) }}</div>
              <div v-if="day.totalSeconds > 0" class="text-green-600 font-medium">
                {{ formatDuration(day.totalSeconds) }}
              </div>
              <div v-else class="text-gray-400">-</div>
            </div>
          </div>
        </div>

        <!-- Monthly Summary -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-4">{{ t('dashboard.monthly_summary') }}</h3>
          <div class="grid grid-cols-7 gap-2 text-center">
            <div v-for="day in attendanceStore.monthlySummary" :key="day.date" 
                 class="p-2 rounded" 
                 :class="day.totalSeconds > 0 ? 'bg-green-50' : 'bg-gray-50'">
              <div class="text-gray-600 mb-1">{{ formatDate(new Date(day.date)) }}</div>
              <div v-if="day.totalSeconds > 0" class="text-green-600 font-medium">
                {{ formatDuration(day.totalSeconds) }}
              </div>
              <div v-else class="text-gray-400">-</div>
            </div>
          </div>

          <!-- Monthly Stats -->
          <div class="mt-4 grid grid-cols-3 gap-4">
            <div class="p-3 rounded bg-green-50">
              <div class="text-sm text-gray-600">{{ t('dashboard.total_days') }}</div>
              <div class="text-xl font-bold text-green-600">
                {{ attendanceStore.monthlySummary.filter(d => d.totalSeconds > 0).length }}
              </div>
            </div>
            <div class="p-3 rounded bg-blue-50">
              <div class="text-sm text-gray-600">{{ t('dashboard.avg_hours') }}</div>
              <div class="text-xl font-bold text-blue-600">
                {{ calculateAverageHours() }}
              </div>
            </div>
            <div class="p-3 rounded bg-purple-50">
              <div class="text-sm text-gray-600">{{ t('dashboard.total_hours') }}</div>
              <div class="text-xl font-bold text-purple-600">
                {{ calculateTotalHours() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Summary Calendar -->
        <div class="monthly-summary mt-8">
          <div class="calendar-header flex justify-between items-center mb-4">
            <button @click="previousMonth" class="btn btn-ghost">
              <i class="fas fa-chevron-left"></i>
            </button>
            <h2 class="text-xl font-semibold">{{ currentMonthYear }}</h2>
            <button @click="nextMonth" class="btn btn-ghost">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <div class="calendar-grid">
            <!-- Days of week header -->
            <div class="grid grid-cols-7 gap-2 mb-2">
              <div v-for="day in daysOfWeek" :key="day" class="text-center font-semibold">
                {{ day }}
              </div>
            </div>
            
            <!-- Calendar days -->
            <div class="grid grid-cols-7 gap-2">
              <div v-for="day in displayCalendarDays" :key="day.date" 
                   class="calendar-day p-2 text-center" 
                   :class="{
                     'bg-gray-100': !day.isCurrentMonth,
                     'attendance-present': day.hasAttendance,
                     'current-day': day.isToday
                   }">
                {{ day.dayOfMonth }}
                <div v-if="day.hasAttendance" class="attendance-time text-xs">
                  {{ formatDuration(day.totalSeconds) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAttendance: boolean;
  totalSeconds: number;
}

const { t } = useI18n();
const attendanceStore = useAttendanceStore();
const { triggerToast } = useToast();

onMounted(async () => {
  await attendanceStore.fetchTodayRecord();
  await attendanceStore.fetchWeeklySummary();
  const now = new Date();
  await attendanceStore.fetchMonthlySummary(now.getFullYear(), now.getMonth() + 1);
});

const dayLocale = localStorage.getItem('locale') || 'en-US';
const formattedDate = useDateFormat(useNow(), 'YYYY-MM-DD (dddd)', { locales: dayLocale });

const formatTime = (date: Date) => {
  return useDateFormat(date, 'HH:mm a').value;
};

const formatDate = (date: Date) => {
  return useDateFormat(date, 'dd MMM', { locales: dayLocale }).value;
};

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
};

const isProcessing = ref(false);

const calculateAverageHours = () => {
  const daysWithHours = attendanceStore.monthlySummary?.filter(day => day.totalSeconds > 0) ?? [];
  if (daysWithHours.length === 0) return '0h';
  
  const totalSeconds = daysWithHours.reduce((sum, day) => sum + (day.totalSeconds ?? 0), 0);
  const avgSeconds = totalSeconds / daysWithHours.length;
  return formatDuration(avgSeconds);
};

const calculateTotalHours = () => {
  const totalSeconds = attendanceStore.monthlySummary?.reduce((sum, day) => sum + (day.totalSeconds ?? 0), 0) ?? 0;
  return formatDuration(totalSeconds);
};

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

const currentDate = ref(new Date());

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('default', { 
    month: 'long', 
    year: 'numeric' 
  });
});

const displayCalendarDays = computed<CalendarDay[]>(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: CalendarDay[] = [];

  // Add days from previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date: date.toISOString().split('T')[0],
      dayOfMonth: date.getDate(),
      isCurrentMonth: false,
      isToday: isSameDate(date, new Date()),
      hasAttendance: false,
      totalSeconds: 0
    });
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    const dateString = date.toISOString().split('T')[0];
    const attendance = attendanceStore.monthlySummary.find(
      (a) => a.date === dateString
    );

    days.push({
      date: dateString,
      dayOfMonth: i,
      isCurrentMonth: true,
      isToday: isSameDate(date, new Date()),
      hasAttendance: !!attendance,
      totalSeconds: attendance?.totalSeconds || 0
    });
  }

  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date: date.toISOString().split('T')[0],
      dayOfMonth: i,
      isCurrentMonth: false,
      isToday: isSameDate(date, new Date()),
      hasAttendance: false,
      totalSeconds: 0
    });
  }

  return days;
});

function previousMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
  fetchMonthData();
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
  fetchMonthData();
}

function isSameDate(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

async function fetchMonthData() {
  await attendanceStore.fetchMonthlySummary(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1
  );
}

// Initial month data is already fetched in the main onMounted callback
</script>

<style scoped>
.calendar-day {
  aspect-ratio: 1;
  border: 1px solid #e2e8f0;
  min-height: 80px;
}

.calendar-day.bg-gray-100 {
  opacity: 0.7;
}

.attendance-present {
  background-color: #e6fffa;
}

.current-day {
  border: 2px solid #4299e1;
}

.attendance-time {
  color: #2c5282;
  margin-top: 4px;
}
</style>