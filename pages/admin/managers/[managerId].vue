<template>
  <div>
    <div class="max-w-3xl mx-auto p-4 border border-gray-200 rounded-lg shadow mt-7">
      <div class="flex justify-center">
        <div class="relative w-36 h-36">
          <span class="sr-only">user photo</span>
          <img class="w-full h-full rounded-full object-cover border-2 border-gray-100 shadow p-1" :src="profileImage"
            alt="user-photo">
        </div>
      </div>

      <div v-if="manager">
        <div class="p-2 text-center">
          <h1 class="text-2xl font-bold capitalize text-gray-800">
            {{ manager.firstName }} {{ manager.lastName }}
          </h1>
          <p class="text-gray-700 mt-1 font-semibold text-lg">{{ manager.position }}</p>
        </div>

        <div class="space-y-6 mt-7 border-t pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.employee_id') }}</p>
              <p class="text-gray-900 font-medium">{{ manager.employeeId }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.department') }}</p>
              <p class="text-gray-900 font-medium" :class="{ 'text-orange-600': !team }">
                {{ translatedDepartmentName }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.email') }}</p>
              <p class="text-gray-900 font-medium">{{ manager.email }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.role') }}</p>
              <p class="text-gray-900 font-medium capitalize">{{ manager.role }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.manager') }}</p>
              <p class="text-gray-900 font-medium">manager name will display here :D</p>
            </div> -->

            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.average_performance') }}</p>
              <p class="text-gray-900 font-medium">average performance will display here :D</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.left_leave_days') }}</p>
              <p class="text-gray-900 font-medium">left leave days will display here :D</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.start_date') }}</p>
              <p class="text-gray-900 font-medium">
                {{ formatDate(manager.createdAt) }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <p class="text-sm text-gray-500">{{ t('dashboard.status') }}</p>
              <span :class="manager.status === 'blocked'
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'" class="px-3 py-1 rounded-full text-sm font-medium">
                {{ manager.status === 'blocked' ? t('status.blocked') : t('status.active') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Manager } from '@/types/managers'

const route = useRoute();
const { t } = useI18n()
const managerStore = useManagerStore();
const teamStore = useTeamStore();
const { formatDate } = useDateFormat();
const manager = ref<Manager | null>(null);
const loading = ref(true);

// useTeamName composable
const { computedTeamName } = useTeamName();

const translatedDepartmentName = computedTeamName(
  () => manager.value?.teamId,
);

const managerId = computed(() => {
  const id = route.params.managerId as string;
  return Array.isArray(id) ? id[0] : id;
});

onMounted(async () => {
  try {
    if (!managerId.value) return;
    const result = await managerStore.fetchManagerById(managerId.value);
    manager.value = result;
    if (teamStore.teams.length === 0) {
      await teamStore.fetchAll();
    }
  } catch (error) {
    manager.value = null;
  } finally {
    loading.value = false;
  }
});

const profileImage = computed(() =>
  manager.value?.profileImg
    ? manager.value.profileImg
    : '/dummy-profile-img.jpg'
);

const team = computed(() => {
  if (!manager.value || !manager.value.teamId) return null;
  return teamStore.teams.find(t => t.id === manager.value!.teamId);
});

useHead({
  titleTemplate: () => t('head.admin_managers_managerid'),
})
</script>