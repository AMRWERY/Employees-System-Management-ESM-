<template>
  <div>
    <div class="date-picker">
      <div class="relative">
        <!-- Input field -->
        <div class="relative">
          <input type="text" :value="formattedDate" readonly @click="toggleCalendar"
            :placeholder="$t('form.select_date')"
            class="w-full px-4 py-2 border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          <div class="absolute inset-y-0 flex items-center pointer-events-none end-0 pe-3">
            <icon name="material-symbols:calendar-month" class="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <!-- Calendar dropdown -->
        <div v-if="showCalendar" class="absolute z-10 w-64 mt-1 bg-gray-50 rounded-xl shadow-2xl">
          <!-- Calendar header -->
          <div class="flex items-center justify-between p-2 border-b">
            <button @click="previousMonth" class="p-1 rounded-full hover:bg-gray-100">
              <icon name="material-symbols:chevron-left" class="w-5 h-5 text-gray-600 rtl:rotate-180" />
            </button>
            <span class="font-semibold text-gray-700">{{ currentMonthYear }}</span>
            <button @click="nextMonth" class="p-1 rounded-full hover:bg-gray-100">
              <icon name="material-symbols:chevron-right" class="w-5 h-5 text-gray-600 rtl:rotate-180" />
            </button>
          </div>

          <!-- Days of week -->
          <div class="grid grid-cols-7 gap-1 p-2 text-center border-b">
            <span v-for="day in daysOfWeek" :key="day" class="text-xs font-medium text-gray-500">
              {{ day }}
            </span>
          </div>

          <!-- Calendar days -->
          <div class="grid grid-cols-7 gap-1 p-2">
            <button v-for="{ date, isCurrentMonth, isToday } in calendarDays" :key="date.toISOString()"
              @click="selectDate(date)" :class="[
                'w-8 h-8 text-sm rounded-full flex items-center justify-center',
                isCurrentMonth ? 'text-gray-700' : 'text-gray-400',
                isToday ? 'bg-indigo-100' : '',
                isSelected(date) ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'hover:bg-gray-100',
              ]">
              {{ date.getDate() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  modelValue: {
    type: Date as PropType<Date | null>,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const showCalendar = ref(false);
const currentDate = ref(props.modelValue || new Date());

// Days of week
const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Format date for display
const formattedDate = computed(() => {
  if (!props.modelValue) return '';
  return props.modelValue.toLocaleDateString();
});

// Current month and year display
const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// Calendar days
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  // Add days from previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDate(date, new Date()),
    });
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDate(date, new Date()),
    });
  }

  // Add days from next month
  const remainingDays = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDate(date, new Date()),
    });
  }

  return days;
});

// Helper functions
const isSameDate = (date1: Date, date2: Date) => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

const isSelected = (date: Date) => {
  return props.modelValue && isSameDate(date, props.modelValue);
};

// Actions
const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value;
};

const selectDate = (date: Date) => {
  emit('update:modelValue', date);
  showCalendar.value = false;
};

const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};

// Close calendar when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (!(event.target as Element).closest('.date-picker')) {
    showCalendar.value = false
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>