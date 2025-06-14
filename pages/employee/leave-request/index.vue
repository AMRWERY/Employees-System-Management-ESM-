<template>
  <div>
    <div class="flex items-center justify-between my-10 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.my_leave_requests') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">

        <!-- add-leave-request component -->
        <add-leave-request />
      </div>
    </div>

    <!-- Tabs -->
    <ul class="flex gap-5 w-max bg-gray-100 p-1 rounded-full mx-auto">
      <li v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
        'tab font-semibold w-full text-center text-[15px] py-2.5 px-5 tracking-wide rounded-full cursor-pointer transition-all duration-300 max-w-fit',
        activeTab === tab.id
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 hover:bg-blue-600 hover:text-white'
      ]">
        {{ tab.label }}
      </li>
    </ul>

    <div v-if="loading" key="skeleton">
      <!-- table-skeleton-loader component -->
      <table-skeleton-loader :headers="skeletonHeaders" :rows="5" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="filteredRequests.length === 0" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_leave_requests_found')" icon="icon-park-outline:vacation" />
      </div>

      <!-- dynamic-table component -->
      <dynamic-table v-else :items="filteredRequests" :columns="tableColumns" :has-view="true"
        @view="(item: LeaveRequest) => openDetailsModal(item)" v-model:selectedItems="selectedItems"
        @update:selectedItems="handleSelectedItemsUpdate" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TableHeader } from '@/types/table-header'
import type { LeaveRequest } from '@/types/leaveRequest'
import type { Column, TableItem } from '@/types/tables'
import type { Tab } from '@/types/tabs'

const { t } = useI18n()
const leaveStore = useLeaveRequestsStore()
const teamssStore = useTeamStore();
const managersStore = useManagerStore();
const { triggerToast } = useToast()
const { formatDate } = useDateFormat();
const { getTeamName } = useTeamName()
const loading = ref(true)

const tableColumns = computed(() => {
  const columns: Column<LeaveRequest>[] = [
    {
      key: 'index',
      label: '#',
      format: (row: LeaveRequest, index?: number) => String((index ?? 0) + 1)
    },
    {
      key: 'dates',
      label: t('dashboard.from_to'),
      format: (request: LeaveRequest) => `
    <div class="flex flex-col">
      <span>${formatDate(request.startDate)}</span>
      <span>${formatDate(request.endDate)}</span>
    </div>
  `,
    },
    { key: 'employeeId', label: t('dashboard.employee_id') },
    {
      key: 'managerId',
      label: t('dashboard.manager'),
      format: (request: LeaveRequest) => {
        if (!request.managerId) return t("dashboard.not_assigned");
        const manager = managersStore.managers.find(m => m.id === request.managerId);
        return manager ? `${manager.firstName} ${manager.lastName}` : t("dashboard.not_assigned");
      }
    },
    {
      key: 'teamId',
      label: t('dashboard.department'),
      format: (request: LeaveRequest) => {
        return getTeamName(request.teamId)
      }
    },
    {
      key: 'type',
      label: t('dashboard.request_type'),
      format: (request: LeaveRequest) => t(`form.${request.type}`)
    },
    {
      key: 'status',
      label: t('dashboard.status'),
      format: (request: LeaveRequest) => t(`status.${request.status}`)
    }
  ];
  return columns;
});

const tabs = ref<Tab[]>([
  { id: 'all', label: t('status.all') },
  { id: 'pending', label: t('status.pending') },
  { id: 'approved', label: t('status.approved') },
  { id: 'rejected', label: t('status.rejected') },
  { id: 'cancelled', label: t('status.cancelled') }
])

const activeTab = ref<Tab['id']>('all')

onMounted(async () => {
  loading.value = true
  try {
    await managersStore.fetchManagers();
    await teamssStore.fetchAll();
    await leaveStore.fetchMyRequests()
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_load_leave_requests'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
  }
})

const selectedRequest = ref<LeaveRequest | null>(null)

const openDetailsModal = (request: LeaveRequest) => {
  selectedRequest.value = request
  navigateTo(`./leave-request/${request.id}`)
}

// Update filtered requests calculation
const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return leaveStore.myRequests;
  return leaveStore.myRequests.filter(request =>
    request.status === activeTab.value
  );
});

// Add skeleton headers configuration
const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-32' }, // Index
  { type: 'text', loaderWidth: 'w-64' }, // Dates
  { type: 'text', loaderWidth: 'w-48' }, // Employee ID
  { type: 'text', loaderWidth: 'w-48' }, // Manager
  { type: 'text', loaderWidth: 'w-48' }, // Department / Team
  { type: 'text', loaderWidth: 'w-48' }, // Type
  { type: 'text', loaderWidth: 'w-32' }, // Status
  { type: 'action', loaderWidth: 'w-32' }, // Actions
])

const selectedItems = ref<TableItem[]>([]);

const handleSelectedItemsUpdate = (items: TableItem[]) => {
  // console.log('Selected items updated:', items);
  selectedItems.value = items;
};

useHead({
  titleTemplate: () => t('head.my_leave_requests'),
});
</script>

<style scoped>
.tab-content[style*="display: none"] {
  display: none !important;
}
</style>