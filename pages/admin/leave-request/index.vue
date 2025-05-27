<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.leave_management') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
      </div>
    </div>

    <!-- Tabs -->
    <ul class="flex gap-5 w-max bg-gray-100 p-1 rounded-full mx-auto">
      <transition-group name="tab-change" tag="div" class="flex gap-5">
        <li v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
          'tab font-semibold w-full text-center text-[15px] py-2.5 px-5 tracking-wide rounded-full cursor-pointer transition-all duration-300 max-w-fit',
          activeTab === tab.id
            ? 'bg-blue-600 text-white'
            : 'text-slate-600 hover:bg-blue-400 hover:text-white'
        ]">
          {{ tab.label }}
        </li>
      </transition-group>
    </ul>
    <transition name="fade-slide" mode="out-in">
      <div v-if="loading" key="skeleton">
        <!-- table-skeleton-loader component -->
        <table-skeleton-loader :headers="skeletonHeaders" :rows="5" />
      </div>

      <div class="mt-8" v-else>
        <div v-if="filteredRequests.length === 0" class="text-center">
          <!-- no-data-message component -->
          <no-data-message :message="t('no_data.no_leave_requests_found')" icon="mdi:clipboard-text-outline" />
        </div>

        <!-- dynamic-table component -->
        <dynamic-table v-else :items="filteredRequests" :columns="tableColumns" :has-view="true"
          @view="(item: LeaveRequest) => openDetailsModal(item)" />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'
import type { TableHeader } from '@/types/table-header'
import type { Column } from '@/types/tables'
import type { Tab } from '@/types/tabs'

const { t } = useI18n()
const leaveStore = useLeaveRequestsStore()
const { triggerToast } = useToast()

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
    {
      key: 'manager',
      label: t('dashboard.manager')
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
})



const tabs = ref<Tab[]>([
  { id: 'all', label: t('status.all') },
  { id: 'pending', label: t('status.pending') },
  { id: 'approved', label: t('status.approved') },
  { id: 'rejected', label: t('status.rejected') },
])

const activeTab = ref<Tab['id']>('all')
const loading = ref(true)

onMounted(async () => {
  try {
    await leaveStore.fetchAllRequests()
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

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return leaveStore.allRequests;
  return leaveStore.allRequests.filter(request =>
    request.status === activeTab.value
  );
})

const openDetailsModal = (request: LeaveRequest) => {
  navigateTo(`./leave-request/${request.id}`)
}

// const handleChildAccept = async (requestId: string) => {
//   try {
//     await leaveStore.approveRequest(requestId);
//     const request = leaveStore.allRequests.find((r) => r.id === requestId);
//     if (request) request.status = 'approved';
//     triggerToast({
//       message: t('toast.leave_request_approved_successfully'),
//       type: 'success',
//       icon: 'mdi-check-circle',
//     });
//   } catch (error) {
//     triggerToast({
//       message: t('toast.failed_to_approve_leave_request'),
//       type: 'error',
//       icon: 'material-symbols:error-outline-rounded',
//     });
//   }
// };

// const handleChildReject = async ({ id, reason }: { id: string; reason: string }) => {
//   try {
//     await leaveStore.rejectRequest(id, reason);
//     const request = leaveStore.allRequests.find((r) => r.id === id);
//     if (request) request.status = 'rejected';
//     triggerToast({
//       message: t('toast.leave_request_rejected_successfully'),
//       type: 'success',
//       icon: 'mdi-check-circle',
//     });
//   } catch (error) {
//     triggerToast({
//       message: t('toast.failed_to_reject_leave_request'),
//       type: 'error',
//       icon: 'material-symbols:error-outline-rounded',
//     });
//   }
// };

// Add skeleton headers configuration
const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-8' },
  { type: 'text', loaderWidth: 'w-48' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-24' },
  { type: 'action', loaderWidth: 'w-48' },
])

useHead({
  titleTemplate: () => t('head.leave_management'),
});
</script>

<style scoped>
.tab-change-enter-active,
.tab-change-leave-active {
  transition: all 0.3s ease;
}

.tab-change-enter-from,
.tab-change-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Content transition */
.fade-slide-enter-active {
  transition: all 0.3s ease-out;
}

.fade-slide-leave-active {
  transition: all 0.2s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.tab {
  position: relative;
  overflow: hidden;
}

.tab[class*='bg-blue-600']::after {
  transform: scaleX(1);
}
</style>