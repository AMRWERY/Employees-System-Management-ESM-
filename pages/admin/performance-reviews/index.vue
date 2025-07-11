<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.employees_performance_reviews') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
        <!-- base-button component -->
        <base-button :default-icon="false" @click="openReviewDialog()">
          {{ t('btn.new_review') }}
        </base-button>

        <!-- add-edit-performance-review component -->
        <add-edit-performance-review v-model="showReviewsDialog" :is-editing="isEditingReviews"
          :review-data="selectedReviewForForm" @save="handleSaveReview" />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <!-- search-input component -->
      <search-input v-model="localSearchTerm" @search="handleGlobalSearch" :placeholder="t('form.search_by_name_or_id')"
        class="w-full sm:w-[300px]" :debounce="300" />

      <!-- select-input component -->
      <select-input v-model="selectedStatusFilterValue" :options="statusOptions"
        :placeholder="t('dashboard.filter_by_ratings_status')" />

      <!-- select-input component -->
      <select-input v-model="selectedReviewPeriod" :options="reviewPeriodOptions"
        :placeholder="t('form.select_period')" />

      <!-- download-files-menu component -->
      <download-files-menu :allItems="employeesPerformanceStore.performanceReviews" :columns="tableColumns"
        fileNameBase="employee-performance" />

      <!-- refresh-data-btn component -->
      <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" />
    </div>

    <div v-if="employeesPerformanceStore.isLoading || refreshingData || isFiltering" key="skeleton">
      <!-- table-skeleton-loader component -->
      <table-skeleton-loader :headers="skeletonHeaders" :rows="7" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="!filteredPerformance.length" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_performance_reviews_found')" icon="heroicons-solid:document-text" />
      </div>

      <div v-else>
        <!-- dynamic-table component -->
        <dynamic-table :items="filteredPerformance" :columns="tableColumns" :has-edit="true" :has-delete="true"
          :has-view="true" v-model:selectedItems="selectedItems" @update:selectedItems="handleSelectedItemsUpdate"
          @edit="handleEditReview" @delete="handleDeleteReview" @view="handleViewEmployee" />
      </div>

      <!-- pagination component -->
      <pagination v-if="employeesPerformanceStore.totalPages > 1"
        :current-page="employeesPerformanceStore.currentPage || 1" :total-pages="employeesPerformanceStore.totalPages"
        @page-change="employeesPerformanceStore.setCurrentPage" />

      <!-- delete-dialog component -->
      <delete-dialog :show="dialogProps.show" :title="dialogProps.title" :message="dialogProps.message"
        :confirm-text="dialogProps.confirmText" :cancel-text="dialogProps.cancelText" :loading="dialogProps.loading"
        @close="dialogProps.onClose" @confirm="dialogProps.onConfirm" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PerformanceReview, SelectOption, RatingStstus } from '@/types/employees-performance'
import type { TableHeader } from '@/types/table-header';
import type { Column, TableItem } from '@/types/tables';
import type { DeleteDialogProps } from '@/types/delete-dialog'

const { t } = useI18n()
const employeesPerformanceStore = useEmployeesPerformanceStore()
const managerStore = useManagerStore()
const authStore = useAuthStore()
const { triggerToast } = useToast();
const { formatDate } = useDateFormat();

const localSearchTerm = ref<string>(employeesPerformanceStore.searchTerm || '');
const refreshingData = ref(false); // For when the refresh button is clicked
const isFiltering = ref(false);
const showReviewsDialog = ref(false);
const isEditingReviews = ref(false);
const selectedReviewForForm = ref<PerformanceReview | null>(null);

const dialogProps = ref<DeleteDialogProps>({
  show: false,
  title: '',
  message: '',
  cancelText: t('btn.cancel'),
  confirmText: t('btn.delete'),
  loading: false
})

const reviewToDelete = ref<PerformanceReview | null>(null)

const handleEditReview = (review: PerformanceReview) => {
  isEditingReviews.value = true;
  selectedReviewForForm.value = { ...review };
  showReviewsDialog.value = true;
}

const handleDeleteReview = (review: PerformanceReview) => {
  reviewToDelete.value = review;
  const name = review.employee_name || review.employee_id || '';
  dialogProps.value = {
    show: true,
    title: t('dashboard.delete_review_title'),
    message: t('dashboard.delete_review_confirmation_01', { name }) + ' ' + t('dashboard.delete_review_confirmation_02'),
    cancelText: t('btn.cancel'),
    confirmText: t('btn.delete'),
    loading: false,
    onClose: () => {
      dialogProps.value.show = false;
      reviewToDelete.value = null;
    },
    onConfirm: async () => {
      dialogProps.value.loading = true;
      try {
        if (!reviewToDelete.value?.id) return;
        await employeesPerformanceStore.deletePerformanceReview(reviewToDelete.value.id);
        dialogProps.value.show = false;
        reviewToDelete.value = null;
        triggerToast({
          message: t('toast.review_deleted'),
          type: 'success',
          icon: 'mdi-check-circle',
        });
        await employeesPerformanceStore.fetchPerformanceReviews();
      } catch (error) {
        triggerToast({
          message: t('toast.operation_failed'),
          type: 'error',
          icon: 'material-symbols:error-outline-rounded',
        });
      } finally {
        dialogProps.value.loading = false;
      }
    }
  };
}

const handleGlobalSearch = (newSearchTerm: string) => {
  employeesPerformanceStore.setSearchTerm(newSearchTerm);
};

const reloadData = async () => {
  if (refreshingData.value) return;
  refreshingData.value = true;
  try {
    await employeesPerformanceStore.fetchPerformanceReviews();
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

const currentPage = computed(() => employeesPerformanceStore.currentPage || 1);
const itemsPerPage = computed(() => employeesPerformanceStore.itemsPerPage || 10);

const reviewers = ref<any[]>([]);

const tableColumns = computed((): Column<PerformanceReview>[] => [
  {
    key: 'index',
    label: '#',
    format: (_row: PerformanceReview, indexOnPage?: number) => {
      const baseIndex = (currentPage.value - 1) * itemsPerPage.value;
      return String((indexOnPage ?? 0) + baseIndex + 1);
    }
  },
  { key: 'employee_id', label: t('dashboard.employee_id') },
  { key: 'employee_name', label: t('dashboard.employee_name'), format: (review: PerformanceReview) => review.employee_name || '—' },
  {
    key: 'reviewer_id', label: t('dashboard.reviewer'),
    format: (review: PerformanceReview) => {
      const reviewer = reviewers.value.find(r => r.id === review.reviewer_id);
      if (!reviewer) return '';
      const baseName = `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim();
      return reviewer.position
        ? `${baseName} (${reviewer.position})`
        : baseName;
    }
  },
  { key: 'overall_score', label: t('dashboard.overall_score'), format: (review: PerformanceReview) => `${review.overall_score}%` },
  {
    key: 'employeeRate',
    label: t('dashboard.overall_rating'),
    format: (review: PerformanceReview) => {
      const key = getEmployeeRate(review.overall_score)
      return t(`status.${key}`)
    }
  },
  {
    key: 'created_at',
    label: t('dashboard.review_date'),
    format: (review: PerformanceReview) => formatDate(review.created_at)
  },
  {
    key: 'review_period',
    label: t('dashboard.review_period'),
    format: (review: PerformanceReview) => {
      const [q, year] = review.review_period.split('-');
      return `${quarterMap[q] || q} - ${year}`;
    }
  }
]);

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-10' },
  { type: 'text', loaderWidth: 'w-40' },
  { type: 'text', loaderWidth: 'w-40' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'action', loaderWidth: 'w-48' },
]);

const router = useRouter();

// Add this handler function
const handleViewEmployee = (review: PerformanceReview) => {
  // Navigate to employee performance details page
  router.push(`/admin/performance-reviews/${review.id}`);
};

onMounted(async () => {
  await employeesPerformanceStore.fetchPerformanceReviews();
  // console.log('Performance Reviews:', employeesPerformanceStore.performanceReviews);

  // Fetch managers first if not already fetched
  if (!managerStore.managers.length) {
    await managerStore.fetchManagers?.();
  }
  reviewers.value = managerStore.managers.map(m => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    position: m.position
  }));
  if (authStore.user?.role === 'admin') {
    reviewers.value.push({
      id: authStore.user.id,
      firstName: authStore.user.firstName,
      lastName: authStore.user.lastName,
      position: 'Admin'
    });
  }
});

const selectedItems = ref<TableItem[]>([]);

const handleSelectedItemsUpdate = (items: TableItem[]) => {
  // console.log('Selected items updated:', items);
  selectedItems.value = items;
};

const handleSaveReview = async (reviewData: PerformanceReview) => {
  showReviewsDialog.value = false;
  const actionToTake = isEditingReviews.value && selectedReviewForForm.value?.id
    ? employeesPerformanceStore.updatePerformanceReview(selectedReviewForForm.value.id, reviewData)
    : employeesPerformanceStore.addPerformanceReview(reviewData);
  try {
    await actionToTake;
    triggerToast({
      message: t(isEditingReviews.value ? 'toast.review_updated' : 'toast.review_added'),
      type: 'success',
      icon: 'mdi-check-circle',
    });
    await employeesPerformanceStore.fetchPerformanceReviews();
  } catch (error) {
    triggerToast({
      message: t('toast.operation_failed'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
    // console.error("Save review failed:", error);
  } finally {
    isEditingReviews.value = false;
    selectedReviewForForm.value = null;
  }
};

const statusOptions = ref<SelectOption[]>([
  { value: 'All', label: t('dashboard.all') },
  { value: 'Top Performer', label: t('dashboard.top_performer') },
  { value: 'Exceeded Expectations', label: t('dashboard.exceeded_expectations') },
  { value: 'Needs Improvement', label: t('dashboard.needs_improvement') }
])

const selectedStatusFilter = ref<string | null>(null);

const selectedStatusFilterValue = computed({
  get: () => selectedStatusFilter.value ?? undefined,
  set: (val: string | undefined) => {
    selectedStatusFilter.value = val ?? null;
  }
});

const classifyReview = (score: number): RatingStstus["status"] => {
  if (score >= 90) return "Top Performer";
  if (score >= 75) return "Exceeded Expectations";
  return "Needs Improvement";
};

const filteredPerformance = computed(() => {
  let performanceReviews = [...employeesPerformanceStore.performanceReviews];
  if (localSearchTerm.value.trim()) {
    const searchLower = localSearchTerm.value.trim().toLowerCase();
    performanceReviews = performanceReviews.filter(review =>
      review.employee_id.toLowerCase().includes(searchLower) ||
      review.review_period.toLowerCase().includes(searchLower)
    );
  }
  if (selectedStatusFilter.value && selectedStatusFilter.value !== 'All') {
    performanceReviews = performanceReviews.filter(review =>
      classifyReview(review.overall_score) === selectedStatusFilter.value
    );
  }
  if (selectedReviewPeriod.value) {
    performanceReviews = performanceReviews.filter(review =>
      review.review_period === selectedReviewPeriod.value
    );
  }
  return performanceReviews;
});

const selectedReviewPeriod = ref<string | undefined>(undefined);

const quarterMap: Record<string, string> = {
  Q1: t('dashboard.quarter_1'),
  Q2: t('dashboard.quarter_2'),
  Q3: t('dashboard.quarter_3'),
  Q4: t('dashboard.quarter_4'),
};

const generateReviewPeriods = (startYear: number, endYear: number): string[] => {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const result: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    for (const q of quarters) {
      result.push(`${q}-${year}`);
    }
  }
  return result;
};

const currentYear = new Date().getFullYear();
const reviewPeriods = ref<string[]>(generateReviewPeriods(currentYear, currentYear + 5));

const reviewPeriodOptions = computed<SelectOption[]>(() => {
  return reviewPeriods.value.map(period => {
    const [quarter, year] = period.split('-');
    const label = `${quarterMap[quarter] || quarter} - ${year}`;
    return {
      value: period,
      label,
    };
  });
});

const openReviewDialog = () => {
  isEditingReviews.value = false;
  selectedReviewForForm.value = null;
  showReviewsDialog.value = true;
};

useHead({
  titleTemplate: () => t('head.employees_performance_reviews'),
})
</script>