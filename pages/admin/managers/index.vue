<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.managers') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
        <!-- base-button component -->
        <base-button :default-icon="false" @click="showAddDialog = true">
          {{ t('btn.add_manager') }}
        </base-button>

        <!-- add-manager component -->
        <add-manager v-model="showAddDialog" @save="handleSave" />
      </div>
    </div>

    <!-- Search input -->
    <!-- <div class="relative w-[300px]">
      <input type="text" v-model="searchTerm" :placeholder="t('form.search_by_email')"
        class="px-4 py-2 pe-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
      <div class="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
        <icon name="heroicons-solid:magnifying-glass" class="w-5 h-5 text-gray-400" />
      </div>
    </div> -->
    <div class="flex items-center gap-4">
      <!-- search-input component -->
      <search-input v-model="localSearchTerm" @search="handleGlobalSearch"
        :placeholder="t('form.search_by_email_or_name')" class="w-full sm:w-[300px]" :debounce="300" />

      <!-- refresh-data-btn component -->
      <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" />

      <!-- download-files-menu component -->
      <download-files-menu :allItems="managerStore.managers" :columns="tableColumns" fileNameBase="managers" />
    </div>

    <div v-if="loading || refreshingData" key="skeleton">
      <!-- table-skeleton-loader component -->
      <table-skeleton-loader :headers="skeletonHeaders" :rows="6" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="managerStore.paginatedManagers.length === 0" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_managers_found')" icon="clarity:employee-group-solid" />
      </div>

      <div v-else>
        <!-- dynamic-table component -->
        <dynamic-table :items="managerStore.paginatedManagers" :columns="tableColumns" :has-view="true"
          :has-block="true" :has-delete="true" @view="viewManagerDetails"
          @block="(item: Manager) => toggleBlockManager(item)" @delete="(item: Manager) => deleteManager(item)" />
      </div>

      <!-- pagination component -->
      <pagination v-if="managerStore.totalPages > 1" :current-page="managerStore.currentPage"
        :total-pages="managerStore.totalPages" @page-change="handlePageChange" />
    </div>

    <!-- delete-dialog component -->
    <delete-dialog :show="dialogProps.show" :title="dialogProps.title" :message="dialogProps.message"
      :confirm-text="dialogProps.confirmText" :cancel-text="dialogProps.cancelText" :loading="dialogProps.loading"
      @close="dialogProps.onClose" @confirm="dialogProps.onConfirm" />
  </div>
</template>

<script lang="ts" setup>
import type { TableHeader } from '@/types/table-header'
import type { Manager } from '@/types/managers'
import type { Column } from '@/types/tables'
import type { DeleteDialogProps } from '@/types/delete-dialog'

const { t } = useI18n()
const router = useRouter()
const managerStore = useManagerStore()
const teamStore = useTeamStore()
const { triggerToast } = useToast()
const { getTeamName } = useTeamName();
const showAddDialog = ref(false);
const loading = ref(true)
const localSearchTerm = ref<string>(managerStore.searchManagersByEmail || '');
const refreshingData = ref(false); // For when the refresh button is clicked

const dialogProps = ref<DeleteDialogProps>({
  show: false,
  title: '',
  message: '',
  cancelText: t('btn.cancel'),
  confirmText: t('btn.reject'),
  loading: false
})

const handlePageChange = (newPage: number) => {
  managerStore.setCurrentPage(newPage);
};

const handleGlobalSearch = (newSearchTerm: string) => {
  managerStore.setSearchTerm(newSearchTerm);
};

const reloadData = async () => {
  if (refreshingData.value) return;
  refreshingData.value = true;
  try {
    await managerStore.fetchManagers();
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

const tableColumns = computed(() => {
  const columns: Column<Manager>[] = [
    {
      key: 'index',
      label: '#',
      format: (row: Manager, index?: number) => String((index ?? 0) + 1)
    },
    { key: 'employeeId', label: t('dashboard.employee_id') },
    {
      key: 'name',
      label: t('form.employee_name'),
      format: (employee: Manager) => `${employee.firstName} ${employee.lastName}`
    },
    { key: 'email', label: t('dashboard.email') },
    {
      key: 'teamId',
      label: t('dashboard.department'),
      format: (employee: Manager) => getTeamName(employee.teamId)
    },
    {
      key: 'status',
      label: t('form.status'),
      format: (employee: Manager) =>
        employee.status === 'blocked'
          ? t('status.blocked')
          : t('status.active')
    }
  ];
  return columns;
})

const viewManagerDetails = (member: Manager) => {
  router.push(`/admin/managers/${member.id}`);
};

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-32' }, // Index
  { type: 'text', loaderWidth: 'w-32' }, // Employee ID
  { type: 'text', loaderWidth: 'w-48' }, // Name
  { type: 'text', loaderWidth: 'w-48' }, // Email
  { type: 'text', loaderWidth: 'w-48' }, // Team / Department
  { type: 'text', loaderWidth: 'w-32' }, // Status
  { type: 'action', loaderWidth: 'w-32' }, // Actions
])

onMounted(async () => {
  refreshingData.value = false;
  loading.value = true
  try {
    localSearchTerm.value = managerStore.searchManagersByEmail || '';
    await Promise.all([
      managerStore.fetchManagers(),
      teamStore.fetchAll()
    ]);
  } catch (error) {
    // console.error('Error fetching managers:', error)
    triggerToast({
      message: t('toast.failed_to_load_managers'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
    refreshingData.value = false;
  }
})

const handleSave = async () => {
  try {
    // Your save logic
    showAddDialog.value = false;
    // triggerToast({...});
  } catch (error) {
    // Error handling
  }
};

const selectedEmployee = ref<Manager | null>(null)

const deleteManager = async (manager: Manager) => {
  selectedEmployee.value = manager
  const name = manager.firstName + ' ' + manager.lastName
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
        await managerStore.deleteManager(manager.id)
        dialogProps.value.show = false
        selectedEmployee.value = null
        triggerToast({
          message: t('toast.manager_deleted'),
          type: 'success',
          icon: 'mdi-check-circle',
        })
      } catch (error) {
        triggerToast({
          message: t('toast.failed_to_delete_manager'),
          type: 'error',
          icon: 'material-symbols:error-outline-rounded',
        })
      } finally {
        dialogProps.value.loading = false
      }
    }
  }
}

const toggleBlockManager = async (manager: Manager) => {
  try {
    await managerStore.toggleBlockManager(manager.id)
    triggerToast({
      message: manager.status === 'blocked'
        ? t('toast.manager_blocked')
        : t('toast.manager_unblocked'),
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

useHead({
  titleTemplate: () => t('head.managers'),
})
</script>