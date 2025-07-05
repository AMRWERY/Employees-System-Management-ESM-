<template>
  <div>
    <!-- employee-profile-skeleton-loader component -->
    <employee-profile-skeleton-loader v-if="loading || !minLoadingDone" />

    <div class="max-w-3xl mx-auto p-4 border border-gray-200 rounded-lg shadow mt-7 shadow-[#005fb3]"
      v-else-if="employee">
      <div class="flex justify-center">
        <div class="relative w-36 h-36">
          <span class="sr-only">user photo</span>
          <img class="w-full h-full rounded-full object-cover border-2 border-gray-100 shadow p-1" :src="profileImage"
            alt="user-photo">
        </div>
      </div>

      <div>
        <div class="p-2 text-center">
          <h1 class="text-2xl font-bold capitalize text-gray-800">
            {{ employee.firstName }} {{ employee.lastName }}
          </h1>
          <p class="text-gray-700 mt-1 font-semibold text-lg">{{ employee.position }}</p>
        </div>

        <div class="w-full max-w-3xl mx-auto space-y-6 bg-white rounded-lg shadow-md p-6 mt-5">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-800 mb-7">{{ t('form.personal_info') }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.employee_id')" :name="t('dashboard.employee_id')" :disabled="true"
                  readonly :model-value="employee.employeeId" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.department')" :name="t('dashboard.department')" :disabled="true"
                  readonly :model-value="translatedDepartmentName" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.email')" :name="t('dashboard.email')" :disabled="true" readonly
                  :model-value="employee.email" />
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

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.manager')" :name="t('dashboard.manager')" :disabled="true" readonly
                  :model-value="managerName" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('dashboard.birthdate')" :name="t('dashboard.birthdate')" :disabled="true"
                  readonly :model-value="formatDate(employee.birthDate)" />
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
                      :model-value="employee.email" />
                  </div> -->

                <!-- <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('dashboard.left_leave_days')" :name="t('dashboard.left_leave_days')" :disabled="true" readonly
                      :model-value="employee.email" />
                  </div> -->

                <div class="sm:col-span-3">
                  <dynamic-inputs :label="t('dashboard.start_date')" :name="t('dashboard.start_date')" :disabled="true"
                    readonly :model-value="formatDate(employee.createdAt)" />
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
  </div>
</template>

<script lang="ts" setup>
import type { Member } from '@/types/teams'

const route = useRoute();
const { t } = useI18n()
const teamsStore = useTeamStore();
const managersStore = useManagerStore()
const { formatDate } = useDateFormat();
const { getTeamName } = useTeamName();
const { formatCurrency } = useCurrencyLocale();
const employee = ref<Member | null>(null);
const loading = ref(true);
const minLoadingDone = ref(false);

onMounted(async () => {
  try {
    minLoadingDone.value = true;
    if (teamsStore.teams.length === 0) {
      teamsStore.fetchAll();
    }
    if (managersStore.managers.length === 0) {
      await managersStore.fetchManagers();
    }
    const employeeId = route.params.employeeId as string;
    const result = await teamsStore.fetchEmployeeById(employeeId);
    if (result) {
      employee.value = result;
      // console.log("Employee data:", {
      //   birthDate: result.birthDate,
      //   hasBirthDate: !!result.birthDate,
      //   type: typeof result.birthDate
      // });
    } else {
      employee.value = null;
    }
    setTimeout(() => {
      minLoadingDone.value = true;
    }, 1000);
  } catch (error) {
    employee.value = null;
  } finally {
    loading.value = false;
  }
});

const translatedDepartmentName = computed(() => getTeamName(employee.value?.teamId))

const managerName = computed(() => {
  if (!employee.value?.managerId) return t('dashboard.not_assigned');
  const manager = managersStore.managers.find(m => m.id === employee.value?.managerId);
  return manager ? `${manager.firstName} ${manager.lastName}` : t('dashboard.not_assigned');
});

const roleTranslation = computed(() => {
  if (!employee.value?.role) return '';
  return t(`roles.${employee.value.role}`);
});

const profileImage = computed(() =>
  employee.value?.profileImg
    ? employee.value.profileImg
    : '/dummy-profile-img.jpg'
);

const statusTranslation = computed(() => {
  if (!employee.value?.status) return '';
  return employee.value.status === 'blocked'
    ? t('status.blocked')
    : t('status.active');
});

const statusClass = computed(() => {
  return employee.value?.status === 'blocked'
    ? 'bg-red-100 text-red-800 px-3 py-1 rounded-full'
    : 'bg-green-100 text-green-800 px-3 py-1 rounded-full';
});

const formattedBaseSalary = computed(() => {
  return formatCurrency(employee.value?.base_salary);
});

const formattedNetSalary = computed(() => {
  return formatCurrency(employee.value?.netSalary) || 0;
});

useHead({
  titleTemplate: () => t('head.admin_teams_employees_employeeid'),
})
</script>