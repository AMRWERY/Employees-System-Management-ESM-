<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.employees') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
        <!-- base-button component -->
        <base-button :default-icon="false" @click="showAddDialog = true">
          {{ t('btn.add_employee') }}
        </base-button>

        <!-- add-employee component -->
        <add-employee v-model="showAddDialog" @save="handleSave" />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <!-- search-input component -->
      <search-input v-model="localSearchTerm" @search="handleGlobalSearch"
        :placeholder="t('form.search_by_email_or_name')" class="w-full sm:w-[300px]" :debounce="300" />

      <!-- refresh-data-btn component -->
      <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" />

      <!-- download-files-menu component -->
      <download-files-menu :allItems="employeesStore.employees" :columns="tableColumns" fileNameBase="employees" />
    </div>

    <div v-if="loading || refreshingData" key="skeleton">
      <!-- table-skeleton-loader component -->
      <table-skeleton-loader :headers="skeletonHeaders" :rows="7" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="paginatedEmployees.length === 0" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_employees_found')" icon="clarity:employee-group-solid" />
      </div>

      <div v-else>
        <!-- dynamic-table component -->
        <dynamic-table :items="paginatedEmployees" :columns="tableColumns" :has-view="true" :has-block="true"
          :has-delete="true" @view="(item: Employee) => viewEmployee(item)"
          @block="(item: Employee) => toggleBlockEmployee(item)" @delete="(item: Employee) => deleteEmployee(item)" />
      </div>

      <!-- pagination component -->
      <pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages"
        @page-change="handlePageChange" />
    </div>

    <!-- delete-dialog component -->
    <delete-dialog :show="dialogProps.show" :title="dialogProps.title" :message="dialogProps.message"
      :confirm-text="dialogProps.confirmText" :cancel-text="dialogProps.cancelText" :loading="dialogProps.loading"
      @close="dialogProps.onClose" @confirm="dialogProps.onConfirm" />
  </div>
</template>

<script lang="ts" setup>
import type { TableHeader } from '@/types/table-header'
import type { Employee } from '@/types/employee'
import type { Column } from '@/types/tables'
import type { DeleteDialogProps } from '@/types/delete-dialog'

const { t } = useI18n()
const managerssStore = useManagerStore()
const employeesStore = useEmployeesStore()
const { triggerToast } = useToast()
const { getTeamName } = useTeamName();
const loading = ref(true)
const localSearchTerm = ref<string>(employeesStore.searchEmployeesByEmail || '');
const refreshingData = ref(false); // For when the refresh button is clicked

const handleGlobalSearch = (newSearchTerm: string) => {
  employeesStore.setSearchTerm(newSearchTerm);
};

const reloadData = async () => {
  if (refreshingData.value) return;
  refreshingData.value = true;
  try {
    await employeesStore.fetchEmployees();
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

// Add state for delete dialog
const dialogProps = ref<DeleteDialogProps>({
  show: false,
  title: '',
  message: '',
  cancelText: t('btn.cancel'),
  confirmText: t('btn.reject'),
  loading: false
})

const selectedEmployee = ref<Employee | null>(null)

const {
  paginatedEmployees,
  currentPage,
  totalPages
} = storeToRefs(employeesStore)

const handlePageChange = (newPage: number) => {
  employeesStore.setCurrentPage(newPage);
};

const tableColumns = computed(() => {
  const columns: Column<Employee>[] = [
    {
      key: 'index',
      label: '#',
      format: (row: Employee, index?: number) => String((index ?? 0) + 1)
    },
    { key: 'employeeId', label: t('dashboard.employee_id') },
    {
      key: 'name',
      label: t('form.employee_name'),
      format: (employee: Employee) => `${employee.firstName} ${employee.lastName}`
    },
    { key: 'email', label: t('form.email') },
    {
      key: 'manager',
      label: t('dashboard.manager'),
      format: (employee: Employee) => {
        if (!employee.managerId) return t("dashboard.not_assigned");
        const manager = managerssStore.managers.find(m => m.id === employee.managerId);
        return manager ? `${manager.firstName} ${manager.lastName}` : t("dashboard.not_assigned");
      }
    },
    {
      key: 'teamId',
      label: t('dashboard.department'),
      format: (employee: Employee) => getTeamName(employee.teamId)
    },
    {
      key: 'status',
      label: t('form.status'),
      format: (employee: Employee) =>
        employee.status === 'blocked'
          ? t('status.blocked')
          : t('status.active')
    }
  ];
  return columns;
})

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-32' }, // Index
  { type: 'text', loaderWidth: 'w-32' }, // Employee ID
  { type: 'text', loaderWidth: 'w-48' }, // Name
  { type: 'text', loaderWidth: 'w-48' }, // Email
  { type: 'text', loaderWidth: 'w-48' }, // Manager
  { type: 'text', loaderWidth: 'w-32' }, // Status
  { type: 'action', loaderWidth: 'w-32' }, // Actions
])

onMounted(async () => {
  refreshingData.value = false;
  loading.value = true
  try {
    localSearchTerm.value = employeesStore.searchEmployeesByEmail || '';
    await employeesStore.fetchEmployees()
    if (managerssStore.managers.length === 0) {
      await managerssStore.fetchManagers()
    }
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_load_employees'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
  }
})

const viewEmployee = (employee: Employee) => {
  // Implement view functionality
  console.log('View employee:', employee)
}

const toggleBlockEmployee = async (employee: Employee) => {
  try {
    await employeesStore.toggleBlockEmployee(employee.id)
    triggerToast({
      message: employee.status === 'blocked'
        ? t('toast.employee_blocked')
        : t('toast.employee_unblocked'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_toggle_block'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  }
}

const deleteEmployee = async (employee: Employee) => {
  selectedEmployee.value = employee
  const name = employee.firstName + ' ' + employee.lastName
  dialogProps.value = {
    show: true,
    title: t('dashboard.delete_employee_title'),
    message: t('dashboard.delete_employee_confirmation_01', { name: name }) + '' + t('dashboard.delete_employee_confirmation_02'),
    cancelText: t('btn.cancel'),
    confirmText: t('btn.reject'),
    loading: false,
    onClose: () => {
      dialogProps.value.show = false
      selectedEmployee.value = null
    },
    onConfirm: async () => {
      dialogProps.value.loading = true
      try {
        await employeesStore.deleteEmployees(employee.id)
        dialogProps.value.show = false
        selectedEmployee.value = null
        triggerToast({
          message: t('toast.employee_deleted'),
          type: 'success',
          icon: 'mdi-check-circle',
        })
      } catch (error) {
        triggerToast({
          message: t('toast.failed_to_delete_employee'),
          type: 'error',
          icon: 'material-symbols:error-outline-rounded',
        })
      } finally {
        dialogProps.value.loading = false
      }
    }
  }
}

const showAddDialog = ref(false);

const handleSave = async () => {
  try {
    // Your save logic
    showAddDialog.value = false;
    // triggerToast({...});
  } catch (error) {
    // Error handling
  }
};

useHead({
  titleTemplate: () => t('head.employees'),
})
</script>