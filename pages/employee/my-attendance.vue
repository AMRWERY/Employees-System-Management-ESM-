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
          <div class="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
            <div v-for="(day, index) in attendanceStore.weeklySummary" :key="day.date"
              class="weekly-day p-2 sm:p-3 rounded-lg transition-all duration-200 text-center" :class="{
                'bg-green-50 shadow-sm hover:bg-green-100': day.totalSeconds > 0,
                'bg-gray-50 hover:bg-gray-100': day.totalSeconds === 0,
                'ring-2 ring-blue-500': isSameDate(new Date(day.date), new Date())
              }" :title="formatDateForTooltip(day.date)">
              <div class="text-xs sm:text-sm text-gray-600 font-medium mb-1">
                {{ t(`days.${day.day.toLowerCase()}`) }}
              </div>
              <div v-if="day.totalSeconds > 0" class="text-green-600 font-medium text-xs sm:text-sm">
                {{ formatDuration(day.totalSeconds) }}
              </div>
              <div v-else class="text-gray-400 text-xs sm:text-sm">-</div>
            </div>
          </div>
        </div>

        <!-- Monthly Summary -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-4">{{ t('dashboard.monthly_summary') }}</h3>
          <!-- Monthly Stats -->
          <div class="mt-4 grid grid-cols-3 gap-4">
            <div class="p-3 rounded bg-green-50">
              <div class="text-sm text-gray-600">{{ t('dashboard.total_days') }}</div>
              <div class="text-xl font-bold text-green-600">
                {{attendanceStore.monthlySummary.filter(d => d.totalSeconds > 0).length}}
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
              <icon name="heroicons-solid:arrow-sm-left" class="rtl:rotate-180" />
            </button>
            <h2 class="text-xl font-semibold">{{ currentMonthYear }}</h2>
            <button @click="nextMonth" class="btn btn-ghost">
              <icon name="heroicons-solid:arrow-sm-right" class="rtl:rotate-180" />
            </button>
          </div>

          <div class="calendar-grid">
            <div class="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              <div v-for="day in daysOfWeek" :key="day" class="text-center font-semibold text-sm sm:text-base">
                {{ day }}
              </div>
            </div>

            <!-- Calendar days -->
            <div class="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
              <div v-for="day in displayCalendarDays" :key="day.date"
                class="calendar-day relative aspect-square p-1 sm:p-2 md:p-3 text-center rounded-lg" :class="{
                  'bg-gray-100': !day.isCurrentMonth,
                  'attendance-present bg-green-50 hover:bg-green-100': day.hasAttendance,
                  'current-day ring-2 ring-blue-500': day.isToday,
                  'hover:bg-gray-50': !day.hasAttendance && day.isCurrentMonth
                }">
                <span class="text-xs sm:text-sm md:text-base font-medium">{{ day.dayOfMonth }}</span>
                <div v-if="day.hasAttendance"
                  class="attendance-time text-[9px] sm:text-xs md:text-sm text-green-600 mt-1">
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

const formatTime = (date: Date | undefined) => {
  if (!date) return '';
  return useDateFormat(date, 'HH:mm a').value;
};

// const formatDate = (date: Date) => {
//   return useDateFormat(date, 'dd MMM', { locales: dayLocale }).value;
// };

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

const currentDate = ref(new Date());

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
  t(`days.${day.toLowerCase()}`)
);

const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());

const currentMonthYear = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value);
  const month = t(`months.${date.toLocaleString('en', { month: 'long' }).toLowerCase()}`);
  return `${month} ${currentYear.value}`;
});

const previousMonth = async () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  await attendanceStore.fetchMonthlySummary(currentYear.value, currentMonth.value + 1);
};

const nextMonth = async () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  await attendanceStore.fetchMonthlySummary(currentYear.value, currentMonth.value + 1);
};

const displayCalendarDays = computed<CalendarDay[]>(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: CalendarDay[] = [];
  // Add days from previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, 1);
    date.setDate(date.getDate() - i);
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    days.push({
      date: localDate.toISOString().split('T')[0],
      dayOfMonth: localDate.getDate(),
      isCurrentMonth: false,
      isToday: isSameDate(localDate, new Date()),
      hasAttendance: false,
      totalSeconds: 0
    });
  }
  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateString = localDate.toISOString().split('T')[0];
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
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    days.push({
      date: localDate.toISOString().split('T')[0],
      dayOfMonth: localDate.getDate(),
      isCurrentMonth: false,
      isToday: isSameDate(localDate, new Date()),
      hasAttendance: false,
      totalSeconds: 0
    });
  }
  return days;
});

function isSameDate(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1.getTime() === d2.getTime();
}

// async function fetchMonthData() {
//   await attendanceStore.fetchMonthlySummary(
//     currentDate.value.getFullYear(),
//     currentDate.value.getMonth() + 1
//   );
// }

// const formatShortDate = (dateStr: string): string => {
//   const date = new Date(dateStr);
//   return date.getDate().toString().padStart(2, '0');
// };

const formatDateForTooltip = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = t(`months.${date.toLocaleString('en', { month: 'long' }).toLowerCase()}`);
  return `${date.getDate()} ${month}`;
}

useHead({
  titleTemplate: () => t('head.my_attendance'),
});
</script>

<style scoped>
.calendar-day {
  transition: all 0.2s ease-in-out;
}

@media (max-width: 640px) {
  .calendar-day {
    min-height: 40px;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .calendar-day {
    min-height: 60px;
  }
}

@media (min-width: 1025px) {
  .calendar-day {
    min-height: 80px;
  }
}

.weekly-day {
  position: relative;
  overflow: hidden;
  min-height: 70px;
}

.weekly-day:hover {
  transform: translateY(-1px);
}

@media (min-width: 640px) {
  .weekly-day {
    min-height: 85px;
  }
}

@media (min-width: 768px) {
  .weekly-day {
    min-height: 100px;
  }
}
</style>