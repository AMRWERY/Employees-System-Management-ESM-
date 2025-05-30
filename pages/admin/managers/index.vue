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

    <div v-if="loading" key="skeleton">
      <!-- table-skeleton-loader component -->
      <table-skeleton-loader :headers="skeletonHeaders" :rows="5" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="managerStore.paginatedManagers.length === 0" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_managers_found')" icon="clarity:employee-group-solid" />
      </div>

      <div v-else>
        <!-- dynamic-table component -->
        <dynamic-table :items="managerStore.paginatedManagers" :columns="tableColumns" :has-view="true"
          :has-block="true" :has-delete="true" @view="viewManagerDetails" />
      </div>

      <!-- pagination component -->
      <pagination v-if="managerStore.totalPages > 1" :current-page="managerStore.currentPage"
        :total-pages="managerStore.totalPages" @page-change="handlePageChange" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TableHeader } from '@/types/table-header'
import type { Manager } from '@/types/managers'
import type { Column } from '@/types/tables'

const { t } = useI18n()
const router = useRouter()
const managerStore = useManagerStore()
const { triggerToast } = useToast()
const showAddDialog = ref(false);
const loading = ref(true)

const handlePageChange = (newPage: number) => {
  managerStore.setCurrentPage(newPage);
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
    { key: 'email', label: t('form.email') },
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
  { type: 'text', loaderWidth: 'w-32' }, // Status
  { type: 'action', loaderWidth: 'w-32' }, // Actions
])

onMounted(async () => {
  loading.value = true
  try {
    await managerStore.fetchManagers()
  } catch (error) {
    console.error('Error fetching managers:', error)
    triggerToast({
      message: t('toast.failed_to_load_managers'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
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

useHead({
  titleTemplate: () => t('head.managers'),
})
</script>