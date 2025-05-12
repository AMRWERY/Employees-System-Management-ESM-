<template>
  <div>
    <div class="flex items-center justify-between my-10 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ $t('dashboard.leave_management') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">

        <!-- view-leave-request-details component-->
        <view-leave-request-details v-if="selectedRequest" :leave-request="selectedRequest"
          @close="selectedRequest = null" />
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
        <p class="font-semibold text-2xl text-gray-700">{{ $t('dashboard.no_leave_requests_found') }}</p>
      </div>

      <!-- dynamic-table componenet -->
      <dynamic-table :requests="filteredRequests" @view="openDetailsModal" @accept="handleAccept" @reject="handleReject"
        v-else />
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
])

const activeTab = ref<Tab['id']>('all')

const leaveStore = useLeaveRequestsStore()

onMounted(() => {
  leaveStore.fetchAllRequests()
})

// Update filtered requests calculation
const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return leaveStore.allRequests;
  return leaveStore.allRequests.filter(request =>
    request.status === activeTab.value
  );
});

const selectedRequest = ref<LeaveRequest | null>(null)

const openDetailsModal = (request: LeaveRequest) => {
  selectedRequest.value = request
}

const handleAccept = (request: LeaveRequest) => {
  // Handle accept logic
}

const handleReject = (request: LeaveRequest) => {
  // Handle reject logic
}

useHead({
  titleTemplate: () => t('head.leave_management'),
});
</script>

<style scoped>
.tab-content[style*="display: none"] {
  display: none !important;
}
</style>