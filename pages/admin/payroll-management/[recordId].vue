<template>
  <div>
    <div class="max-w-3xl mx-auto p-4 border border-gray-200 rounded-lg shadow mt-7" v-if="employee">
      <div class="flex justify-center">
        <div class="relative w-36 h-36">
          <span class="sr-only">user photo</span>
          <img class="w-full h-full rounded-full object-cover border-2 border-gray-100 shadow p-1"
            :src="employee.profileImg || '/dummy-profile-img.jpg'" alt="user-photo">
        </div>
      </div>

      <div class="mb-6">
        <div class="p-2 text-center">
          <h1 class="text-2xl font-bold capitalize text-gray-800">
            {{ employee.firstName }} {{ employee.lastName }}
          </h1>
          <p class="text-gray-700 mt-1 font-semibold text-lg">{{ employee.position }}</p>
        </div>

        <div class="space-y-6 mt-7 border-t pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.employee_id') }}</p>
              <p class="text-gray-900 font-medium">{{ employee.employeeId }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.department') }}</p>
              <p class="text-gray-900 font-medium">
                {{ employee.teamId ? getTeamName(employee.teamId) : t('dashboard.not_assigned') }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.email') }}</p>
              <p class="text-gray-900 font-medium">{{ employee.email }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.role') }}</p>
              <p class="text-gray-900 font-medium capitalize">{{ employee.role }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.manager') }}</p>
              <p class="text-gray-900 font-medium">{{ getManagerName(employee.managerId) }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.start_date') }}</p>
              <p class="text-gray-900 font-medium">
                {{ formatDate(employee.createdAt) }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ t('dashboard.base_salary') }}</p>
              <p class="text-gray-900 font-medium capitalize">{{ formatCurrency(employee.payrolls[0]?.base_salary) }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <p class="text-sm text-gray-500">{{ t('dashboard.status') }}</p>
              <span :class="employee.status === 'blocked'
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'" class="px-3 py-1 rounded-full text-sm font-medium">
                {{ employee.status === 'blocked' ? t('status.blocked') : t('status.active') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t pt-6">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">
          {{ t('dashboard.payroll_history') }}
        </h2>

        <!-- refresh-data-btn component -->
        <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" class="mb-4" />

        <div v-if="!employee.payrolls || employee.payrolls.length === 0 || employee.payrolls.every(p => !p.id)">
          <!-- no-data-message componenet -->
          <no-data-message :message="t('no_data.no_payroll_history_found')" icon="heroicons-solid:document-text" />
        </div>

        <div v-else class="overflow-x-auto">
          <!-- table-skeleton-loader componenet -->
          <table-skeleton-loader :headers="skeletonHeaders" :rows="5" v-if="isLoading || refreshingData" />

          <!-- dynamic-table componenet -->
          <dynamic-table :items="employee.payrolls" :columns="tableColumns" v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PayrollAllStatus } from '@/types/payroll';
import type { Payroll } from '@/types/payroll'
import type { TableHeader } from '@/types/table-header';
import type { Column } from '@/types/tables';

const { t, n } = useI18n();
const route = useRoute();
const employeesStore = useEmployeesStore();
const teamStore = useTeamStore();
const managerStore = useManagerStore();
const { formatDate } = useDateFormat();
const { currentCurrency } = useCurrencyLocale();
const { getTeamName: getTeamNameFromComposable } = useTeamName();
const { triggerToast } = useToast();
const isLoading = ref(false);
const refreshingData = ref(false);

const employeeIdFromRoute = computed(() => {
  const id = route.params.recordId;
  return Array.isArray(id) ? id[0] : id;
});

onMounted(async () => {
  if (route.params.id) {
    await employeesStore.fetchEmployeeWithPayrolls(route.params.id as string);
  }
});

const { selectedEmployeeDetails: employee } = storeToRefs(employeesStore);

const fetchDetails = async () => {
  if (employeeIdFromRoute.value) {
    try {
      isLoading.value = true;
      employeesStore.selectedEmployeeDetails = null;
      await employeesStore.fetchEmployeeWithPayrolls(employeeIdFromRoute.value);
      // console.log('Fetched payrolls:', employee.value?.payrolls);
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

onMounted(async () => {
  // Fetch supporting data if not already present
  if (teamStore.teams.length === 0) {
    await teamStore.fetchAll();
  }
  if (managerStore.managers.length === 0) {
    await managerStore.fetchManagers();
  }
  await fetchDetails();
});

// Fetch data when ID changes
watch(() => route.params.recordId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await fetchDetails();
  }
}, { immediate: false });

const getPayrollStatusClass = (status: PayrollAllStatus | undefined): string => {
  if (!status) return 'bg-gray-100 text-gray-800'; // Default for undefined or null
  switch (status.toLowerCase()) {
    case PayrollAllStatus.Pending:
      return 'bg-yellow-100 text-yellow-800';
    case PayrollAllStatus.Paid:
      return 'bg-green-100 text-green-800';
    case PayrollAllStatus.Failed:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800'; // Fallback for unexpected status
  }
};

const getTeamName = (teamId?: string | null): string => {
  if (!teamId) return t('dashboard.not_assigned', 'N/A');
  return getTeamNameFromComposable(teamId); // Use the imported composable
};

const getManagerName = (managerId?: string | null): string => {
  if (!managerId) return t('dashboard.not_assigned', 'N/A');
  const manager = managerStore.managers.find(m => m.id === managerId);
  return manager ? `${manager.firstName || ''} ${manager.lastName || ''}`.trim() : t('dashboard.not_assigned');
};

const formatCurrency = (value?: number) => {
  if (value == null || isNaN(value)) return;
  const formatKey = `currency_${currentCurrency.value}`;
  try {
    return n(value, formatKey);
  } catch (e) {
    return String(value);
  }
};

const tableColumns = computed((): Column<Payroll>[] => [
  {
    key: 'index',
    label: '#',
    format: (_row: Payroll, indexOnPage?: number) => String((indexOnPage ?? 0) + 1), // Simple index
  },
  {
    key: 'pay_period',
    label: t('dashboard.pay_period'),
    format: (p: Payroll) => p.pay_period || t('common.na', 'N/A'),
  },
  {
    key: 'netSalary',
    label: t('dashboard.net_salary'),
    format: (p: Payroll) => formatCurrency(p.netSalary) || t('common.na', 'N/A'),
  },
  {
    key: 'status',
    label: t('dashboard.status'),
    format: (p: Payroll) => t(`status.${p.status?.toLowerCase() || 'unknown'}`, p.status || 'Unknown'),
    class: (p: Payroll) => ['px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', getPayrollStatusClass(p.status)],
  },
  {
    key: 'paidOn',
    label: t('dashboard.paid_on'),
    format: (p: Payroll) => {
      // console.log('paidOn type:', typeof p.paidOn, 'value:', p.paidOn);
      return p.paidOn ? formatDate(p.paidOn) : t('common.na', 'N/A');
    },
  },
]);

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-10' }, // Index
  { type: 'text', loaderWidth: 'w-32' }, // Pay Period
  { type: 'text', loaderWidth: 'w-32' }, // Net Salary
  { type: 'text', loaderWidth: 'w-32' }, // Status
  { type: 'text', loaderWidth: 'w-32' }, // Paid On
]);

const reloadData = async () => {
  if (refreshingData.value || isLoading.value) return;
  refreshingData.value = true;
  try {
    await fetchPayrollsOnly(),
      triggerToast({
        message: t('toast.data_refreshed_successfully'),
        type: 'info',
        icon: 'mdi:check-circle-outline',
      });
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_reload_data'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    refreshingData.value = false;
  }
};

const fetchPayrollsOnly = async () => {
  if (employee.value) {
    const payrollStore = usePayrollStore();
    try {
      // Use employee's custom ID instead of document ID
      const payrolls = await payrollStore.fetchPayrollsByEmployeeId(employee.value.employeeId);
      employee.value.payrolls = payrolls;
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
      throw error;
    }
  }
};

useHead({
  title: computed(() =>
    employee.value
      ? `${employee.value.firstName} ${employee.value.lastName} - ${t('dashboard.details')}`
      : t('dashboard.employee_details')
  ),
});
</script>