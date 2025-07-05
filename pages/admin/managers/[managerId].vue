<template>
  <div>
    <!-- employee-profile-skeleton-loader component -->
    <employee-profile-skeleton-loader v-if="loading || !minLoadingDone" />

    <div class="max-w-3xl mx-auto p-4 border border-gray-200 rounded-lg shadow mt-7 shadow-[#005fb3]"
      v-else-if="manager">
      <div class="flex justify-center">
        <div class="relative w-36 h-36">
          <span class="sr-only">user photo</span>
          <img class="w-full h-full rounded-full object-cover border-2 border-gray-100 shadow p-1" :src="profileImage"
            alt="user-photo">
        </div>
      </div>

      <div>
        <div class="p-2 text-center text-gray-800">
          <h1 class="text-2xl capitalize font-bold">
            {{ manager.firstName }} {{ manager.lastName }}
          </h1>
        </div>

        <div class="w-full max-w-3xl mx-auto space-y-6 bg-white rounded-lg shadow-md p-6 mt-5">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-800 mb-7">{{ t('form.personal_info') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.employee_id')" :name="t('dashboard.employee_id')" :disabled="true"
                  readonly :model-value="manager.employeeId" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('form.department')" :name="t('form.department')" :disabled="true" readonly
                  :model-value="teamName">
                  <template #custom>
                    <div :class="{ 'text-orange-600': !team }">
                      {{ teamName }}
                    </div>
                  </template>
                </dynamic-inputs>
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.email')" :name="t('dashboard.email')" :disabled="true" readonly
                  :model-value="manager.email" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.role')" :name="t('dashboard.role')" :disabled="true" readonly
                  :model-value="roleTranslation">
                  <template #custom>
                    <div>
                      {{ roleTranslation }}
                    </div>
                  </template>
                </dynamic-inputs>
              </div>

              <!-- <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.manager')" :name="t('dashboard.manager')" :disabled="true" readonly
                  :model-value="manager.email" />
              </div> -->

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.birthdate')" :name="t('dashboard.birthdate')" :disabled="true"
                  readonly :model-value="formatDate(manager.birthDate)" />
              </div>
            </div>
          </div>

          <div class="space-y-4 pt-4 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800 mb-7">{{ t('form.other_info') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('form.base_salary')" :name="t('form.base_salary')" :disabled="true" readonly
                  :model-value="formattedBaseSalary" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('form.net_salary')" :name="t('form.net_salary')" :disabled="true" readonly
                  :model-value="formattedNetSalary" />
              </div>

              <!-- <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.average_performance')" :name="t('dashboard.average_performance')" :disabled="true" readonly
                  :model-value="manager.email" />
              </div> -->

              <!-- <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.left_leave_days')" :name="t('dashboard.left_leave_days')" :disabled="true" readonly
                  :model-value="manager.email" />
              </div> -->

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.start_date')" :name="t('dashboard.start_date')" :disabled="true"
                  readonly :model-value="formatDate(manager.createdAt)" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('form.status')" :name="t('form.status')" :disabled="true" readonly
                  :model-value="statusTranslation">
                  <template #custom>
                    <div :class="statusClass">
                      {{ statusTranslation }}
                    </div>
                  </template>
                </dynamic-inputs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Manager } from '@/types/managers'

const { t } = useI18n()
const route = useRoute();
const managerStore = useManagerStore();
const teamStore = useTeamStore();
const { formatDate } = useDateFormat();
const { getTeamName } = useTeamName();
const { formatCurrency } = useCurrencyLocale();
const manager = ref<Manager | null>(null);
const loading = ref(true);
const minLoadingDone = ref(false);

const formattedBaseSalary = computed(() => {
  return formatCurrency(manager.value?.base_salary);
});

const formattedNetSalary = computed(() => {
  return formatCurrency(manager.value?.netSalary);
});

const teamName = computed(() => getTeamName(manager.value?.teamId))

const managerId = computed(() => {
  const id = route.params.managerId as string;
  return Array.isArray(id) ? id[0] : id;
});

onMounted(async () => {
  try {
    minLoadingDone.value = false;
    if (!managerId.value) return;
    const result = await managerStore.fetchManagerById(managerId.value);
    manager.value = result;
    if (teamStore.teams.length === 0) {
      await teamStore.fetchAll();
    }
    setTimeout(() => {
      minLoadingDone.value = true;
    }, 1000);
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

const roleTranslation = computed(() => {
  if (!manager.value?.role) return '';
  return t(`roles.${manager.value.role}`);
});

const statusTranslation = computed(() => {
  if (!manager.value?.status) return '';
  return manager.value.status === 'blocked'
    ? t('status.blocked')
    : t('status.active');
});

const statusClass = computed(() => {
  return manager.value?.status === 'blocked'
    ? 'bg-red-100 text-red-800 px-3 py-1 rounded-full'
    : 'bg-green-100 text-green-800 px-3 py-1 rounded-full';
});

useHead({
  titleTemplate: () => t('head.admin_managers_managerid'),
})
</script>