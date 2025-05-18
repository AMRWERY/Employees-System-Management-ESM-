<template>
  <div>
    <!-- breadcrumb component -->
    <breadcrumb />

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
    <!-- Search input -->
    <div class="relative w-[300px]">
      <input type="text" v-model="searchTerm" :placeholder="t('form.search_by_email')"
        class="px-4 py-2 pe-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
      <div class="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
        <icon name="heroicons-solid:magnifying-glass" class="w-5 h-5 text-gray-400" />
      </div>
    </div>

    <div v-if="loading" key="skeleton">
      <table-skeleton-loader :headers="skeletonHeaders" :rows="5" />
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
    </div>

    <!-- delete-dialog component -->
    <delete-dialog :show="dialogProps.show" :title="dialogProps.title" :message="dialogProps.message"
      :confirm-text="dialogProps.confirmText" :cancel-text="dialogProps.cancelText" :loading="dialogProps.loading"
      @close="dialogProps.onClose" @confirm="dialogProps.onConfirm" />
  </div>
</template>

<script lang="ts" setup>
import { type TableHeader } from '@/components/shared/table-skeleton-loader.vue'
import type { Employee } from '@/types/employee'
import type { Column } from '@/components/shared/dynamic-table.vue'

interface DeleteDialogProps {
  show: boolean
  title?: string
  message?: string
  cancelText?: string
  confirmText?: string
  loading?: boolean
  onClose?: () => void
  onConfirm?: () => void
}

const { t } = useI18n()
const { triggerToast } = useToast()
const loading = ref(true)
const searchTerm = ref('')

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

const employeesStore = useEmployeesStore()
const {
  paginatedEmployees,
  currentPage,
  totalPages
} = storeToRefs(employeesStore)

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
    { key: 'manager', label: t('dashboard.manager') },
    {
      key: 'status',
      label: t('form.status'),
      format: (employee: Employee) => employee.isBlocked ? t('status.blocked') : t('status.active')
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
  loading.value = true
  try {
    await employeesStore.fetchEmployees()
  } catch (error) {
    console.error('Error fetching employees:', error)
    triggerToast({
      message: t('toast.failed_to_load_employees'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
  }
})

watch(searchTerm, (value: string) => {
  employeesStore.setSearchTerm(value)
})

const viewEmployee = (employee: Employee) => {
  // Implement view functionality
  console.log('View employee:', employee)
}

const toggleBlockEmployee = async (employee: Employee) => {
  try {
    await employeesStore.toggleBlockEmployee(employee.id)
    triggerToast({
      message: employee.isBlocked
        ? t('toast.employee_unblocked')
        : t('toast.employee_blocked'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
  } catch (error) {
    console.error('Error blocking employee:', error)
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