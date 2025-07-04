<template>
  <div>
    <div id="birthdate-modal" v-if="showDialog">
      <div
        class="fixed inset-0 px-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div
          class="w-full max-w-lg bg-gradient-to-b from-[#16a34a] via-[#4ade80] to-[#bbf7d0] shadow-lg rounded-lg p-6 relative mx-auto text-center">
          <icon name="twemoji:birthday-cake"
            class="w-20 h-20 text-green-500 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />

          <div class="mt-7">
            <h3 class="text-slate-900 text-2xl font-semibold flex-1">{{ t('dashboard.awesome') }}</h3>

            <!-- Carousel Navigation -->
            <div v-if="birthdateStore.hasMultipleEmployees" class="flex justify-between items-center mt-2">
              <button @click="birthdateStore.prevEmployee" class="p-1 rounded-full">
                <icon name="mdi:chevron-left" class="text-2xl text-gray-200 rtl:rotate-180" />
              </button>

              <div class="text-sm text-gray-200">
                {{ birthdateStore.currentIndex + 1 }} / {{ birthdateStore.todaysBirthdays.length }}
              </div>

              <button @click="birthdateStore.nextEmployee" class="p-1 rounded-full">
                <icon name="mdi:chevron-right" class="text-2xl text-gray-200 rtl:rotate-180" />
              </button>
            </div>

            <div class="grid grid-cols-2 grid-rows-1 gap-5 mt-4">
              <div class="border border-gray-400 rounded-lg shadow-sm overflow-hidden p-1">
                <img src="@/public/hb.jpg" alt="Birthday celebration" class="w-full h-48 object-cover rounded-lg" />
              </div>

              <div class="border border-gray-400 rounded-lg shadow-sm overflow-hidden p-1">
                <img v-if="employeeProfileImg" :src="employeeProfileImg" alt="Employee"
                  class="w-full h-48 object-cover rounded-lg" />
                <img v-else src="/dummy-profile-img.jpg" alt="Default profile"
                  class="w-full h-48 object-cover rounded-lg" />
              </div>
            </div>

            <div class="mt-5">
              <p class="text-lg text-slate-600 leading-relaxed">
                {{ t('dashboard.birthday_mss_1') }}
                <span class="font-semibold text-indigo-600 underline capitalize">{{ employeeName }}</span>
                {{ t('dashboard.birthday_mss_2') }}
              </p>
            </div>

            <button id="closeButton" type="button" @click="closeDialog"
              class="px-6 py-2.5 mt-6 w-full rounded-md text-white text-sm font-semibold tracking-wide border-none outline-none bg-green-500 hover:bg-green-600">
              {{ t('btn.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const emit = defineEmits(['close']);
const birthdateStore = useBirthdateStore();
const showDialog = ref(false);

const employeeName = computed(() => {
  if (!birthdateStore.currentEmployee) return '';
  return `${birthdateStore.currentEmployee.firstName} ${birthdateStore.currentEmployee.lastName}`;
});

const employeeProfileImg = computed(() => {
  return birthdateStore.currentEmployee?.profileImg || null;
});

const closeDialog = () => {
  showDialog.value = false;
  emit('close');
};

onMounted(async () => {
  await birthdateStore.checkTodaysBirthdays();
  showDialog.value = birthdateStore.todaysBirthdays.length > 0;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>