<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.performance_reviews') }}</p>
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

    <div class="flex flex-col sm:flex-row gap-4 mb-6 items-end">
      <div class="flex items-center gap-4">
        <!-- search-input component -->
        <search-input v-model="localSearchTerm" @search="handleGlobalSearch"
          :placeholder="t('form.search_by_name_or_id')" class="w-full sm:w-[300px]" :debounce="300" />

        <!-- refresh-data-btn component -->
        <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" />

        <!-- download-files-menu component -->
        <download-files-menu :allItems="employeesPerformanceStore.performanceReviews" :columns="tableColumns"
          fileNameBase="employee-performance" />

        <!-- select-input component -->
        <!-- <select-input :placeholder="t('dashboard.filter_by_status')" /> -->
      </div>

      <!-- <div class="flex flex-col">
        <label for="filterPayPeriodInput" class="text-sm font-medium text-gray-700 mb-1">{{
          t('form.filter_by_pay_period') }}</label>
        <input type="month" id="filterPayPeriodInput" :value="employeesPerformanceStore.filterPayPeriod"
          @change="handlePayPeriodChange(($event.target as HTMLInputElement).value)"
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto">
      </div> -->
      <!-- No "Apply Filters" button needed if store handles changes reactively -->

      <!-- Use store's isLoading for the skeleton -->
      <div v-if="employeesPerformanceStore.isLoading || refreshingData || isFiltering" key="skeleton-loader">
        <!-- table-skeleton-loader componenet -->
        <table-skeleton-loader :headers="skeletonHeaders" :rows="8" />
      </div>

      <div class="mt-8" v-else>
        <div v-if="!filteredPerformance.length" class="text-center">
          <!-- no-data-message componenet -->
          <no-data-message :message="t('no_data.no_performance_reviews_found')" icon="heroicons-solid:document-text" />
        </div>
        <div v-else>
          <!-- dynamic-table componenet -->
          <dynamic-table :items="filteredPerformance" :columns="tableColumns" :has-edit="true" :has-delete="true"
            :has-view="true" v-model:selectedItems="selectedItems" @update:selectedItems="handleSelectedItemsUpdate" />
        </div>

        <!-- pagination componenet -->
        <pagination v-if="employeesPerformanceStore.totalPages > 1"
          :current-page="employeesPerformanceStore.currentPage || 1" :total-pages="employeesPerformanceStore.totalPages"
          @page-change="employeesPerformanceStore.setCurrentPage" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PerformanceReview } from '@/types/employees-performance'
import type { TableHeader } from '@/types/table-header';
import type { Column, TableItem } from '@/types/tables';

const { t } = useI18n()
const employeesPerformanceStore = useEmployeesPerformanceStore()
const { triggerToast } = useToast();

const localSearchTerm = ref<string>(employeesPerformanceStore.searchTerm || '');
const refreshingData = ref(false); // For when the refresh button is clicked
const isFiltering = ref(false);
const showReviewsDialog = ref(false);
const isEditingReviews = ref(false);
const selectedReviewForForm = ref<PerformanceReview | null>(null);

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
  { key: 'review_period', label: t('dashboard.review_period') },
  { key: 'reviewer_id', label: t('dashboard.reviewer') },
  { key: 'overall_score', label: t('dashboard.overall_score') },
  // { 
  //   key: 'created_at', 
  //   label: t('dashboard.review_date'),
  //   format: (review: PerformanceReview) => formatDate(review.created_at)
  // },
]);

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-10' },
  { type: 'text', loaderWidth: 'w-40' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  // { type: 'text', loaderWidth: 'w-32' },
  { type: 'action', loaderWidth: 'w-48' },
]);

const filteredPerformance = computed(() => {
  let performanceReviews = [...employeesPerformanceStore.performanceReviews];
  if (localSearchTerm.value.trim()) {
    const searchLower = localSearchTerm.value.trim().toLowerCase();
    performanceReviews = performanceReviews.filter(review =>
      review.employee_id.toLowerCase().includes(searchLower) ||
      review.review_period.toLowerCase().includes(searchLower)
    );
  }
  return performanceReviews;
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
    console.error("Save review failed:", error);
  } finally {
    isEditingReviews.value = false;
    selectedReviewForForm.value = null;
  }
};

const openReviewDialog = () => {
  isEditingReviews.value = false;
  selectedReviewForForm.value = null;
  showReviewsDialog.value = true;
};

useHead({
  titleTemplate: () => t('head.performance_reviews'),
})
</script>