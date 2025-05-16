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

    <div class="mt-8">
      <div v-if="filteredRequests.length === 0" class="p-4 text-center text-gray-500">
        <p class="font-semibold text-2xl text-gray-700">{{ t('dashboard.no_leave_requests_found') }}</p>
      </div>

      <!-- dynamic-table componenet -->
      <dynamic-table :requests="filteredRequests" @view="openDetailsModal" v-else />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'

const { t } = useI18n()

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

const leaveStore = useLeaveRequestsStore()

onMounted(() => {
  leaveStore.fetchMyRequests()
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

useHead({
  titleTemplate: () => t('head.my_leave_requests'),
});
</script>

<style scoped>
.tab-content[style*="display: none"] {
  display: none !important;
}
</style>