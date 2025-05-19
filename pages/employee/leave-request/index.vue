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
        @view="(item: LeaveRequest) => openDetailsModal(item)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type TableHeader } from '@/components/shared/table-skeleton-loader.vue'
import type { LeaveRequest } from '@/types/leaveRequest'
import type { Column } from '@/components/shared/dynamic-table.vue'

const { t } = useI18n()
const leaveStore = useLeaveRequestsStore()
const { triggerToast } = useToast()
const loading = ref(true)

const { formatDate } = useDateFormat();

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
      format: (request: LeaveRequest) => `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`
    },
    { key: 'employeeId', label: t('dashboard.employee_id') },
    { key: 'manager', label: t('dashboard.manager') },
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

interface Tab {
  id: LeaveRequest['status'] | 'all'
  label: string
}

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
  { type: 'text', loaderWidth: 'w-48' }, // Type
  { type: 'text', loaderWidth: 'w-32' }, // Status
  { type: 'action', loaderWidth: 'w-32' }, // Actions
])

useHead({
  titleTemplate: () => t('head.my_leave_requests'),
});
</script>

<style scoped>
.tab-content[style*="display: none"] {
  display: none !important;
}
</style>