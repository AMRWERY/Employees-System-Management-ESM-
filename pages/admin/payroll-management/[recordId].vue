<template>
  <div>
    <!-- employee-profile-skeleton-loader component -->
    <employee-profile-skeleton-loader v-if="isLoading || !minLoadingDone" />

    <div class="max-w-3xl mx-auto p-4 border border-gray-200 rounded-lg shadow mt-7" v-else-if="employee">
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

        <div class="space-y-6 mt-4 border-t pt-4">
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

        <div class="flex items-center gap-4 mb-4">
          <!-- refresh-data-btn component -->
          <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" />

          <!-- download-files-menu component -->
          <download-files-menu :allItems="employee.payrolls" :columns="tableColumns" :fileNameBase="fileName" />

          <!-- select-input component -->
          <select-input v-model="selectedStatus" :options="statusOptions"
            :placeholder="t('dashboard.filter_by_status')" />
        </div>

        <div class="overflow-x-auto">
          <!-- table-skeleton-loader componenet -->
          <table-skeleton-loader :headers="skeletonHeaders" :rows="8"
            v-if="isLoading || refreshingData || isFiltering" />

          <div v-else-if="!filteredPayrolls.length">
            <!-- no-data-message componenet -->
            <no-data-message :message="t('no_data.no_payroll_history_found')" icon="heroicons-solid:document-text" />
          </div>

          <!-- dynamic-table componenet -->
          <dynamic-table :items="filteredPayrolls" :columns="tableColumns" v-model:selectedItems="selectedItems"
            @update:selectedItems="handleSelectedItemsUpdate" v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PayrollAllStatus } from '@/types/payroll';
import type { Payroll, SelectOption } from '@/types/payroll'
import type { TableHeader } from '@/types/table-header';
import type { Column, TableItem } from '@/types/tables';

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
const selectedStatus = ref(PayrollAllStatus.All);
const isFiltering = ref(false);
const minLoadingDone = ref(false);

const statusOptions = computed<SelectOption[]>(() => [
  { value: PayrollAllStatus.All, label: t('status.all') },
  { value: PayrollAllStatus.Pending, label: t('status.pending') },
  { value: PayrollAllStatus.Paid, label: t('status.paid') },
  { value: PayrollAllStatus.Failed, label: t('status.failed') },
]);

const filteredPayrolls = computed(() => {
  if (!employee.value?.payrolls) return [];
  if (selectedStatus.value === PayrollAllStatus.All) {
    return employee.value.payrolls;
  }
  return employee.value.payrolls.filter(
    payroll => payroll.status === selectedStatus.value
  );
});

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
      minLoadingDone.value = false;
      employeesStore.selectedEmployeeDetails = null;
      await employeesStore.fetchEmployeeWithPayrolls(employeeIdFromRoute.value);
      // console.log('Fetched payrolls:', employee.value?.payrolls);
      setTimeout(() => {
        minLoadingDone.value = true;
      }, 1000);
    } catch (error) {
      // console.error('Failed to fetch employee details:', error);
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
  if (!status) return 'bg-gray-100 text-gray-800';
  switch (status.toLowerCase()) {
    case PayrollAllStatus.Pending:
      return 'bg-yellow-100 text-yellow-800';
    case PayrollAllStatus.Paid:
      return 'bg-green-100 text-green-800';
    case PayrollAllStatus.Failed:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTeamName = (teamId?: string | null): string => {
  if (!teamId) return t('dashboard.not_assigned');
  return getTeamNameFromComposable(teamId);
};

const getManagerName = (managerId?: string | null): string => {
  if (!managerId) return t('dashboard.not_assigned');
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
    format: (_row: Payroll, indexOnPage?: number) => String((indexOnPage ?? 0) + 1),
  },
  {
    key: 'pay_period',
    label: t('dashboard.pay_period'),
    format: (p: Payroll) => p.pay_period || '-',
  },
  {
    key: 'netSalary',
    label: t('dashboard.net_salary'),
    format: (p: Payroll) => formatCurrency(p.netSalary) || '-',
  },
  {
    key: 'base_salary',
    label: t('dashboard.base_salary',),
    format: (p: Payroll) => formatCurrency(p.base_salary) || '-',
  },
  {
    key: 'overtime_hours',
    label: t('dashboard.overtime_hours'),
    format: (p: Payroll) => {
      if (typeof p.overtime_hours === 'number') {
        const hoursLabel = p.overtime_hours === 1 ? t('units.hour', 'hour') : t('units.hours', 'hours');
        return `${p.overtime_hours} ${hoursLabel}`;
      }
      return '-';
    },
  },
  {
    key: 'overtime_rate',
    label: t('dashboard.overtime_rate'),
    format: (p: Payroll) => {
      if (typeof p.overtime_rate === 'number') {
        return n(p.overtime_rate / 100, 'percent');
      }
      return '-';
    },
  },
  {
    key: 'created_at',
    label: t('dashboard.creation_date'),
    format: (p: Payroll) => {
      return p.created_at ? formatDate(p.created_at.toDate()) : '-';
    },
  },
  {
    key: 'status',
    label: t('dashboard.status'),
    format: (p: Payroll) => t(`status.${p.status?.toLowerCase() || 'unknown'}`, p.status || 'Unknown'),
    class: (p: Payroll) => ['px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', getPayrollStatusClass(p.status)],
  },
]);

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-10' },  // Index
  { type: 'text', loaderWidth: 'w-24' },  // Pay Period
  { type: 'text', loaderWidth: 'w-28' },  // Net Salary
  { type: 'text', loaderWidth: 'w-28' },  // Base Salary
  { type: 'text', loaderWidth: 'w-24' },  // Overtime Hours
  { type: 'text', loaderWidth: 'w-24' },  // Overtime Rate
  { type: 'text', loaderWidth: 'w-28' },  // Creation Date
  { type: 'text', loaderWidth: 'w-24' },  // Status
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
      isFiltering.value = true;
      // Use employee's custom ID instead of document ID
      const payrolls = await payrollStore.fetchPayrollsByEmployeeId(employee.value.employeeId);
      employee.value.payrolls = payrolls;
    } catch (error) {
      // console.error('Failed to fetch payrolls:', error);
      throw error;
    } finally {
      isFiltering.value = false;
    }
  }
};

const selectedItems = ref<TableItem[]>([]);

const handleSelectedItemsUpdate = (items: TableItem[]) => {
  // console.log('Selected items updated:', items);
  selectedItems.value = items;
};

const fileName = computed(() =>
  employee.value
    ? `${employee.value.firstName} ${employee.value.lastName} - ${t('dashboard.payrolls')}`
    : t('dashboard.employee_payrolls')
);

watch(selectedStatus, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    isFiltering.value = true;
    setTimeout(() => {
      isFiltering.value = false;
    }, 1000);
  }
});

useHead({
  title: computed(() =>
    employee.value
      ? `${employee.value.firstName} ${employee.value.lastName} - ${t('dashboard.details')}`
      : t('dashboard.employee_details')
  ),
});
</script>