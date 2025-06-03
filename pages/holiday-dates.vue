<template>
    <div>
        <div class="max-w-7xl mx-auto p-4">
            <div class="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-500">
                <div class="flex items-center justify-between px-6 py-4 bg-gray-800 text-white rounded-t-lg">
                    <button @click="prevMonth" class="p-2 rounded-full transition-colors">
                        <icon name="material-symbols:chevron-left" class="w-6 h-6 rtl:rotate-180" />
                    </button>
                    <h2 class="text-xl font-semibold">{{ monthName }} {{ currentYear }}</h2>
                    <button @click="nextMonth" class="p-2 rounded-full transition-colors">
                        <icon name="material-symbols:chevron-right" class="w-6 h-6 rtl:rotate-180" />
                    </button>
                </div>

                <div class="grid grid-cols-7 gap-px bg-gray-200" v-if="!loading">
                    <div v-for="day in dayHeaders" :key="day"
                        class="text-center py-3 bg-gray-100 text-gray-700 font-medium text-sm rounded-t-none">
                        {{ day }}
                    </div>

                    <div v-for="blank in blankDays" :key="'blank-' + blank"
                        class="bg-gray-50 p-2 h-24 sm:h-32 rounded-none"></div>

                    <div v-for="day in daysInMonth" :key="day.date" :class="[
                        'p-2 text-center relative h-24 sm:h-32 overflow-hidden rounded-none cursor-pointer',
                        isToday(day.date) ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white hover:bg-gray-50',
                        day.isHolidayEgypt ? 'bg-green-100 border border-green-400' : ''
                    ]">
                        <span :class="[
                            'text-sm sm:text-base font-medium',
                            isToday(day.date) ? 'text-blue-700 font-bold' : 'text-gray-800',
                            day.isHolidayEgypt ? 'text-green-700 font-bold' : ''
                        ]">
                            {{ day.dayNumber }}
                        </span>
                        <div v-if="day.isHolidayEgypt && day.holidayName"
                            class="mt-1 text-xs text-green-600 break-words leading-tight">
                            <p class="font-semibold mt-4">{{ localizedHolidayName(day) }}</p>
                        </div>
                    </div>
                </div>

                <div v-else class="grid grid-cols-7 gap-px bg-gray-200 animate-pulse">
                    <!-- Skeleton for day headers -->
                    <div v-for="n in 7" :key="'header-skel-' + n" class="h-10 bg-gray-300 rounded"></div>
                    <!-- Skeleton for blank days -->
                    <div v-for="n in blankDays.length" :key="'blank-skel-' + n"
                        class="bg-gray-100 h-24 sm:h-32 rounded"></div>
                    <!-- Skeleton for days in month -->
                    <div v-for="n in numDaysInMonth" :key="'day-skel-' + n" class="bg-gray-100 h-24 sm:h-32 rounded">
                    </div>
                </div>

                <div v-if="error" class="p-4 text-center text-red-500">{{ error }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import holidaysData from '../assets/arab-holidays.json';

const { t, locale } = useI18n();
const { triggerToast } = useToast();

// Reactive state for current date, holidays, loading, and errors
const currentDate = ref(new Date());
const allHolidaysData = ref([]);
const loading = ref(true);
const error = ref(null);

// --- Holiday Data Loading ---
function loadHolidays() {
    loading.value = true;
    setTimeout(() => {
        try {
            allHolidaysData.value = holidaysData;
            error.value = null;
        } catch (e) {
            // console.error("Failed to load holidays:", e);
            triggerToast({
                message: t('toast.failed_to_load_holidays_data'),
                type: 'error',
                icon: 'material-symbols:error-rounded'
            })
            allHolidaysData.value = [];
        } finally {
            loading.value = false;
        }
    }, 1000);
}

// Load holidays when the component is mounted
onMounted(loadHolidays);

// --- Calendar Logic ---
const dayHeaders = [t('days.sun'), t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat')];

// Computed property for the displayed month and year
const currentMonth = computed(() => currentDate.value.getMonth());

const currentYear = computed(() => currentDate.value.getFullYear());

const monthName = computed(() => {
    const months = [
        t('months.january'),
        t('months.february'),
        t('months.march'),
        t('months.april'),
        t('months.may'),
        t('months.june'),
        t('months.july'),
        t('months.august'),
        t('months.september'),
        t('months.october'),
        t('months.november'),
        t('months.december')
    ];
    return months[currentMonth.value];
});

// Get holidays for Egypt for the current view
const egyptHolidays = computed(() => {
    if (!allHolidaysData.value || allHolidaysData.value.length === 0) return [];
    const egyptData = allHolidaysData.value.find(country => country.country_code === 'EG');
    return egyptData ? egyptData.holidays : [];
});

// Check if a specific date is an Egyptian holiday
function isEgyptianHoliday(dateString) {
    return egyptHolidays.value.find(holiday => holiday.date === dateString);
}

const localizedHolidayName = (day) => {
    if (!day.holidayName) return '';
    return locale.value.startsWith('ar') ?
        day.holidayName.ar :
        day.holidayName.en;
};

// Get the number of days in the current month
const numDaysInMonth = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    return new Date(year, month + 1, 0).getDate();
});

// Get the first day of the month (0 for Sunday, 1 for Monday, etc.)
const firstDayOfMonth = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    return new Date(year, month, 1).getDay();
});

// Generate blank days to align the start of the month
const blankDays = computed(() => {
    return Array(firstDayOfMonth.value).fill(null);
});

// Generate the actual days for the calendar grid
const daysInMonth = computed(() => {
    const days = [];
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    for (let i = 1; i <= numDaysInMonth.value; i++) {
        const dateObj = new Date(year, month, i);
        const dateString = dateObj.toISOString().split('T')[0];
        const holidayInfo = isEgyptianHoliday(dateString);
        days.push({
            date: dateString,
            dayNumber: i,
            isHolidayEgypt: !!holidayInfo,
            holidayName: holidayInfo ? { en: holidayInfo.name_en, ar: holidayInfo.name_ar } : null,
        });
    }
    return days;
});

// --- Navigation ---
function prevMonth() {
    currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() - 1,
        1
    );
}

function nextMonth() {
    currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() + 1,
        1
    );
}

// Helper to check if a date is today
function isToday(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(dateString);
    compareDate.setHours(0, 0, 0, 0);
    return today.getTime() === compareDate.getTime();
}

useHead({
    titleTemplate: () => t('head.holiday_dates'),
});
</script>