<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.leave_management') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
      </div>
    </div>

    <!-- dynamic-tabs component -->
    <dynamic-tabs :tabs="tabs" v-model:activeTab="activeTab" />

    <div class="flex items-center gap-4 mt-4">
      <!-- search-input component -->
      <search-input v-model="leaveStore.searchTerm" @search="handleGlobalSearch"
        :placeholder="t('form.search_by_email_or_name')" class="w-full sm:w-[300px]" :debounce="300" />

      <!-- refresh-data-btn component -->
      <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" />

      <!-- download-files-menu component -->
      <download-files-menu :allItems="leaveStore.allRequests" :columns="tableColumns" fileNameBase="leave-requests" />
    </div>

    <transition name="fade-slide" mode="out-in">
      <div v-if="loading || refreshingData" key="skeleton-refresh">
        <!-- table-skeleton-loader component -->
        <table-skeleton-loader :headers="skeletonHeaders" :rows="8" />
      </div>

      <div class="mt-8" v-else>
        <div v-if="filteredRequests.length === 0" class="text-center">
          <!-- no-data-message component -->
          <no-data-message :message="t('no_data.no_leave_requests_found')" icon="mdi:clipboard-text-outline" />
        </div>

        <!-- dynamic-table component -->
        <dynamic-table v-else :items="paginatedRequests" :columns="tableColumns" :has-view="true"
          @view="(item: LeaveRequest) => openDetailsModal(item)" v-model:selectedItems="selectedItems"
          @update:selectedItems="handleSelectedItemsUpdate" />

        <!-- pagination component -->
        <pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages"
          @page-change="handlePageChange" />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'
import type { TableHeader } from '@/types/table-header'
import type { Column, TableItem } from '@/types/tables'
import type { Tab } from '@/types/tabs'

const { t } = useI18n()
const leaveStore = useLeaveRequestsStore()
const managersStore = useManagerStore();
// const teamssStore = useTeamStore();
const { triggerToast } = useToast()
const { formatDate } = useDateFormat();
const { getTeamName } = useTeamName();
const localSearchTerm = ref<string>(leaveStore.searchTerm || '');
const refreshingData = ref(false); // For when the refresh button is clicked
const activeTab = ref<Tab['id']>('all')
const loading = ref(true)

const {
  paginatedRequests,
  currentPage,
  totalPages
} = storeToRefs(leaveStore)

const handleGlobalSearch = (newSearchTerm: string) => {
  leaveStore.setSearchTerm(newSearchTerm);
};

onMounted(async () => {
  refreshingData.value = false;
  try {
    localSearchTerm.value = leaveStore.searchTerm || '';
    await managersStore.fetchManagers();
    // await teamssStore.fetchAll();
    await leaveStore.fetchAllRequests()
    leaveStore.updatePagination();
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_load_leave_requests'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
    refreshingData.value = false;
  }
})

const reloadData = async () => {
  if (refreshingData.value) return;
  refreshingData.value = true;
  try {
    leaveStore.allRequests = [];
    await leaveStore.fetchAllRequests();
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

const handlePageChange = (newPage: number) => {
  leaveStore.setCurrentPage(newPage);
};

watch(activeTab, (newTab) => {
  leaveStore.setFilter(newTab);
});

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
    {
      key: 'employeeName',
      label: t('dashboard.employee_name'),
    },
    {
      key: 'employeeId',
      label: t('dashboard.employee_id'),
    },
    {
      key: 'managerId',
      label: t('dashboard.manager'),
      format: (request: LeaveRequest) => {
        if (!request.managerId) return t("dashboard.not_assigned");
        const manager = managersStore.managers.find(m => m.id === request.managerId);
        // console.log(manager)
        return manager ? `${manager.firstName} ${manager.lastName}` : t("dashboard.not_assigned");
      }
    },
    {
      key: 'teamId',
      label: t('dashboard.department'),
      format: (request: LeaveRequest) => getTeamName(request.teamId)
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

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'all'

const tabs = ref<Tab<LeaveStatus>[]>([
  { id: 'all', label: t('status.all') },
  { id: 'pending', label: t('status.pending') },
  { id: 'approved', label: t('status.approved') },
  { id: 'rejected', label: t('status.rejected') },
  { id: 'cancelled', label: t('status.cancelled') },
])

const filteredRequests = computed(() => {
  return leaveStore.filteredAndSearchedRequests;
});

// const filteredRequests = computed(() => {
//   if (activeTab.value === 'all') return leaveStore.allRequests;
//   return leaveStore.allRequests.filter(request =>
//     request.status === activeTab.value
//   );
// })

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

const selectedItems = ref<TableItem[]>([]);

const handleSelectedItemsUpdate = (items: TableItem[]) => {
  // console.log('Selected items updated:', items);
  selectedItems.value = items;
};

useHead({
  titleTemplate: () => t('head.leave_management'),
});
</script>