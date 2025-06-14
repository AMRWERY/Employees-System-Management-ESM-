<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.payroll_management') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
        <!-- base-button component -->
        <base-button :default-icon="false" @click="openAddPayrollDialog()">
          {{ t('btn.add_record') }}
        </base-button>

        <!-- add-edit-payroll component -->
        <add-edit-payroll v-model="showPayrollDialog" :is-editing="isEditingPayroll"
          :payroll-data="selectedPayrollForForm" @save="handleSavePayroll" />
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
        <download-files-menu :allItems="payrollStore.allPayrolls" :columns="tableColumns" fileNameBase="payrolls" />
      </div>

      <div class="flex flex-col">
        <label for="filterPayPeriodInput" class="text-sm font-medium text-gray-700 mb-1">{{
          t('form.filter_by_pay_period') }}</label>
        <input type="month" id="filterPayPeriodInput" :value="payrollStore.filterPayPeriod"
          @change="handlePayPeriodChange(($event.target as HTMLInputElement).value)"
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto">
      </div>
      <!-- No "Apply Filters" button needed if store handles changes reactively -->
    </div>

    <!-- Use store's isLoading for the skeleton -->
    <div v-if="payrollStore.isLoading && payrollStore.paginatedItems.length === 0 || refreshingData"
      key="skeleton-loader">
      <!-- table-skeleton-loader componenet -->
      <table-skeleton-loader :headers="skeletonHeaders" :rows="9" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="!payrollStore.isLoading && payrollStore.paginatedItems.length === 0" class="text-center">
        <!-- no-data-message componenet -->
        <no-data-message :message="t('no_data.no_payroll_records_found')" icon="heroicons-solid:document-text" />
      </div>
      <div v-else>
        <!-- dynamic-table componenet -->
        <dynamic-table :items="payrollStore.paginatedItems" :columns="tableColumns" :has-edit="true" :has-delete="true"
          :has-view="true" :has-mark-paid="true" :has-mark-failed="true" :action-conditions="payrollActionConditions"
          @edit="editPayroll" @delete="deletePayrollClicked" @markPaid="markPayrollAsPaid"
          @markFailed="markPayrollAsFailed" @view="navigateToEmployeeDetails" v-model:selectedItems="selectedItems"
            @update:selectedItems="handleSelectedItemsUpdate" />
      </div>

      <!-- pagination componenet -->
      <pagination v-if="payrollStore.totalPages > 1" :current-page="payrollStore.currentPage"
        :total-pages="payrollStore.totalPages" @page-change="payrollStore.setCurrentPage" />
    </div>

    <!-- delete-dialog componenet -->
    <delete-dialog :show="deleteDialogProps.show" :title="deleteDialogProps.title" :message="deleteDialogProps.message"
      :confirm-text="deleteDialogProps.confirmText" :cancel-text="deleteDialogProps.cancelText"
      :loading="deleteDialogActive" @close="closeDeleteDialog" @confirm="confirmDelete" />

    <!-- mark-failed-reson componenet -->
    <mark-failed-reson v-model="showFailureReasonDialog" :confirm-text="t('btn.submit')" :loading="isSubmittingFailure"
      @confirm="submitFailureReason" @close="cancelFailureReason" />
  </div>
</template>

<script lang="ts" setup>
import type { Payroll, PayrollInputData, AppTimestamp } from '@/types/payroll';
import { PayrollAllStatus } from '@/types/payroll';
import type { TableHeader } from '@/types/table-header';
import type { Column, TableItem } from '@/types/tables';
import type { DeleteDialogProps } from '@/types/delete-dialog';

const { t, n } = useI18n();
const router = useRouter()
const payrollStore = usePayrollStore();
const employeeStore = useEmployeesStore();
const { getTeamName } = useTeamName();
const { triggerToast } = useToast();
const { currentCurrency } = useCurrencyLocale();

const showPayrollDialog = ref(false);
const isEditingPayroll = ref(false);
const selectedPayrollForForm = ref<Payroll | null>(null);
const selectedPayrollForAction = ref<Payroll | null>(null);

const showFailureReasonDialog = ref(false);
const failureReasonError = ref(''); // For displaying validation errors in the reason dialog
const isSubmittingFailure = ref(false);
const payrollToMarkFailed = ref<Payroll | null>(null);

const deleteDialogProps = ref<Omit<DeleteDialogProps, 'loading'>>({
  show: false, title: '', message: '',
  cancelText: t('btn.cancel'), confirmText: t('btn.delete'),
});

const deleteDialogActive = ref(false);
const localSearchTerm = ref<string>(payrollStore.searchTerm || '');
const refreshingData = ref(false); // For when the refresh button is clicked

const handleGlobalSearch = (newSearchTerm: string) => {
  payrollStore.setSearchTerm(newSearchTerm);
};

const reloadData = async () => {
  if (refreshingData.value) return;
  refreshingData.value = true;
  try {
    await payrollStore.fetchPayrolls();
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

// --- Table Columns and Action Conditions ---
const tableColumns = computed((): Column<Payroll>[] => [
  {
    key: 'index', label: '#',
    format: (_row: Payroll, indexOnPage?: number) => {
      const baseIndex = (payrollStore.currentPage - 1) * payrollStore.itemsPerPage;
      return String((indexOnPage ?? 0) + baseIndex + 1);
    }
  },
  { key: 'uid', label: t('dashboard.employee_id') },
  { key: 'employeeName', label: t('form.employee_name') },
  { key: 'department_id', label: t('dashboard.department'), format: (employee: Payroll) => getTeamName(employee.department_id) },
  { key: 'pay_period', label: t('dashboard.pay_period') },
  { key: 'base_salary', label: t('dashboard.base_salary'), format: (p: Payroll) => formatCurrency(p.base_salary) },
  { key: 'net_salary', label: t('dashboard.net_salary'), format: (p: Payroll) => formatCurrency(p.netSalary) },
  // { key: 'paidOn', label: t('dashboard.paid_on'), format: (p: Payroll) => p.paidOn ? formatDate(p.paidOn) : '-' },
  { key: 'status', label: t('form.status'), format: (p: Payroll) => t(`status.${p.status.toLowerCase()}`, p.status) },
]);

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-10' },
  { type: 'text', loaderWidth: 'w-40' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'action', loaderWidth: 'w-48' },
]);

const payrollActionConditions = computed(() => ({
  edit: (item: Payroll): boolean => {
    return item.status === PayrollAllStatus.Pending;
  },
  markPaid: (item: Payroll): boolean => {
    return item.status === PayrollAllStatus.Pending;
  },
  markFailed: (item: Payroll): boolean => {
    return item.status === PayrollAllStatus.Pending;
  },
  delete: (item: Payroll): boolean => {
    return item.status === PayrollAllStatus.Pending || item.status === PayrollAllStatus.Paid || item.status === PayrollAllStatus.Failed;
  },
}));

onMounted(async () => {
  refreshingData.value = false;
  if (!payrollStore.filterPayPeriod) {
    const now = new Date();
    payrollStore.filterPayPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  localSearchTerm.value = payrollStore.searchTerm || '';
  await payrollStore.fetchPayrolls();
});

const handlePayPeriodChange = async (newPeriod: string) => {
  await payrollStore.setFilterPayPeriod(newPeriod);
  // fetchPayrolls is called within setFilterPayPeriod
};

// --- Dialog and Action Handlers ---
const openAddPayrollDialog = () => {
  isEditingPayroll.value = false;
  selectedPayrollForForm.value = null;
  showPayrollDialog.value = true;
};

const editPayroll = (payroll: Payroll) => {
  isEditingPayroll.value = true;
  selectedPayrollForForm.value = { ...payroll }; // Clone for editing
  showPayrollDialog.value = true;
};

const markPayrollAsFailed = (payroll: Payroll) => {
  payrollToMarkFailed.value = payroll;
  showFailureReasonDialog.value = true;
};

const submitFailureReason = async (reason: string) => {
  if (!payrollToMarkFailed.value?.id) return;
  isSubmittingFailure.value = true;
  const startTime = Date.now();
  try {
    const user = JSON.parse(sessionStorage.getItem('user') ?? '{}');
    const failedBy = user?.role;
    // Mark as failed with reason
    await payrollStore.recordPaymentFailure(
      payrollToMarkFailed.value.id,
      reason,
      failedBy
    );
    triggerToast({
      message: t('toast.marked_as_failed_successfully'),
      type: 'success',
      icon: 'mdi-check-circle',
    });
    await payrollStore.fetchPayrolls();
    showFailureReasonDialog.value = false;
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_mark_failed'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    // Ensure spinner shows for at least 2 seconds
    const elapsed = Date.now() - startTime;
    if (elapsed < 2000) {
      await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
    }
    isSubmittingFailure.value = false;
  }
};

const cancelFailureReason = () => {
  showFailureReasonDialog.value = false;
  payrollToMarkFailed.value = null;
};

const handleSavePayroll = async (payrollInput: PayrollInputData | Payroll) => {
  showPayrollDialog.value = false;
  const actionToTake = isEditingPayroll.value && selectedPayrollForForm.value?.id
    ? payrollStore.updatePayroll(selectedPayrollForForm.value.id, payrollInput as Partial<PayrollInputData>)
    : payrollStore.addPayroll(payrollInput as PayrollInputData);
  try {
    const result = await actionToTake;
    if (result) {
      triggerToast({
        message: t(isEditingPayroll.value ? 'toast.payroll_updated' : 'toast.payroll_added'),
        type: 'success',
        icon: 'mdi-check-circle',
      })
      await payrollStore.fetchPayrolls();
    }
  } catch (error) {
    triggerToast({
      message: t('toast.operation_failed'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
    // console.error("Save payroll failed:", error);
  } finally {
    isEditingPayroll.value = false;
    selectedPayrollForForm.value = null;
  }
};

const deletePayrollClicked = (payroll: Payroll) => {
  selectedPayrollForAction.value = payroll;
  deleteDialogProps.value = {
    ...deleteDialogProps.value, // Keep default texts
    show: true,
    title: t('dashboard.delete_payroll_title'),
    message: `${t('dashboard.delete_payroll_confirmation_01', { name: payroll.employeeName, period: payroll.pay_period })} ${t('dashboard.delete_payroll_confirmation_02')}`,
  };
};

const closeDeleteDialog = () => {
  deleteDialogProps.value.show = false;
  selectedPayrollForAction.value = null;
};

const confirmDelete = async () => {
  if (!selectedPayrollForAction.value?.id) return;
  deleteDialogActive.value = true;
  try {
    await payrollStore.deletePayroll(selectedPayrollForAction.value.id);
    triggerToast({
      message: t('toast.payroll_deleted'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_delete_payroll'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
    // console.error("Delete payroll failed:", error);
  } finally {
    deleteDialogActive.value = false;
    closeDeleteDialog();
  }
};

const markPayrollAsPaid = async (payroll: Payroll) => {
  if (!payroll.id) return;
  try {
    await payrollStore.processPayment(payroll.id, 'ADMIN_UID_PLACEHOLDER'); // Replace with actual admin UID
    triggerToast({
      message: t('toast.marked_as_paid_successfully'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
    await payrollStore.fetchPayrolls();
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_mark_paid'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  }
}

const navigateToEmployeeDetails = async (payrollItem: Payroll) => {
  if (!payrollItem || !payrollItem.uid) return;
  if (employeeStore.employees.length === 0) {
    try {
      await employeeStore.fetchEmployees();
    } catch (e) {
      return;
    }
  }
  const targetEmployee = employeeStore.employees.find(emp => emp.employeeId === payrollItem.uid);
  if (targetEmployee && targetEmployee.id) {
    const employeeFirestoreId = targetEmployee.id;
    const routepath = `/admin/payroll-management/${employeeFirestoreId}`
    router.push(routepath);
  } else {
    triggerToast({
      message: t('toast.could_not_find_full_details_for_employee'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  }
};

const formatCurrency = (value?: number) => {
  if (value == null) return '-';
  const formatKey = `currency_${currentCurrency.value}`;
  const formatted = n(value, formatKey);
  return formatted;
};

const selectedItems = ref<TableItem[]>([]);

const handleSelectedItemsUpdate = (items: TableItem[]) => {
  // console.log('Selected items updated:', items);
  selectedItems.value = items;
};

useHead({
  titleTemplate: () => t('head.payroll_management'),
})
</script>