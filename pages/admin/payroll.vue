<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.payroll_management') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
        <base-button :default-icon="false" @click="openAddPayrollDialog()">
          {{ t('btn.add_record') }}
        </base-button>

        <!-- add-edit-payroll component -->
        <add-edit-payroll v-model="showPayrollDialog" :is-editing="isEditingPayroll"
          :payroll-data="selectedPayrollForForm" @save="handleSavePayroll" />
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-6 items-end">
      <div class="relative w-full sm:w-[300px]">
        <input type="text" :value="payrollStore.searchTerm"
          @input="payrollStore.setSearchTerm(($event.target as HTMLInputElement).value)"
          :placeholder="t('form.search_by_name_or_id')"
          class="px-4 py-2 pe-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
        <div class="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
          <icon name="heroicons-solid:magnifying-glass" class="w-5 h-5 text-gray-400" />
        </div>
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
    <div v-if="payrollStore.isLoading && payrollStore.paginatedItems.length === 0" key="skeleton-loader">
      <table-skeleton-loader :headers="skeletonHeaders" :rows="payrollStore.itemsPerPage" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="!payrollStore.isLoading && payrollStore.paginatedItems.length === 0" class="text-center">
        <no-data-message :message="t('no_data.no_payroll_records_found')" icon="heroicons-solid:document-text" />
      </div>
      <div v-else>
        <dynamic-table :items="payrollStore.paginatedItems" :columns="tableColumns" :has-edit="true" :has-delete="true"
          :has-mark-paid="true" :has-mark-failed="true" :action-conditions="payrollActionConditions" @edit="editPayroll"
          @delete="deletePayrollClicked" @markPaid="markPayrollAsPaid" />
      </div>
      <pagination v-if="payrollStore.totalPages > 1" :current-page="payrollStore.currentPage"
        :total-pages="payrollStore.totalPages" @page-change="payrollStore.setCurrentPage" />
    </div>

    <delete-dialog :show="deleteDialogProps.show" :title="deleteDialogProps.title" :message="deleteDialogProps.message"
      :confirm-text="deleteDialogProps.confirmText" :cancel-text="deleteDialogProps.cancelText"
      :loading="deleteDialogActive" @close="closeDeleteDialog" @confirm="confirmDelete" />
  </div>
</template>

<script lang="ts" setup>
import type { Payroll, PayrollInputData, AppTimestamp } from '@/types/payroll';
import { PayrollAllStatus } from '@/types/payroll';
import type { TableHeader } from '@/types/table-header';
import type { Column } from '@/types/tables';
import type { DeleteDialogProps } from '@/types/delete-dialog';

const { t } = useI18n();
const payrollStore = usePayrollStore();
// const { triggerToast } = useToast();

// --- Component State for UI control ---
const showPayrollDialog = ref(false);
const isEditingPayroll = ref(false);
const selectedPayrollForForm = ref<Payroll | null>(null); // For passing to the form dialog
const selectedPayrollForAction = ref<Payroll | null>(null); // For context in delete/mark actions

const deleteDialogProps = ref<Omit<DeleteDialogProps, 'loading'>>({ // loading is local
  show: false, title: '', message: '',
  cancelText: t('btn.cancel'), confirmText: t('btn.delete'),
});
const deleteDialogActive = ref(false); // Local loading for delete dialog confirm button


// --- Table Columns and Action Conditions ---
const tableColumns = computed((): Column<Payroll>[] => [
  {
    key: 'index', label: '#',
    format: (_row: Payroll, indexOnPage?: number) => {
      const baseIndex = (payrollStore.currentPage - 1) * payrollStore.itemsPerPage;
      return String((indexOnPage ?? 0) + baseIndex + 1);
    }
  },
  { key: 'name', label: t('form.employee_name') },
  { key: 'uid', label: t('dashboard.employee_id') },
  { key: 'pay_period', label: t('payroll.pay_period') },
  { key: 'net_salary', label: t('payroll.net_salary'), format: (p: Payroll) => formatCurrency(p.netSalary) },
  { key: 'status', label: t('form.status'), format: (p: Payroll) => t(`payroll_status.${p.status.toLowerCase()}`, p.status) },
  { key: 'paidOn', label: t('payroll.paidOn'), format: (p: Payroll) => p.paidOn ? formatDate(p.paidOn) : t('common.na') }
]);

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-10' }, { type: 'text', loaderWidth: 'w-40' },
  { type: 'text', loaderWidth: 'w-32' }, { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' }, { type: 'text', loaderWidth: 'w-24' },
  { type: 'text', loaderWidth: 'w-32' }, { type: 'action', loaderWidth: 'w-48' },
]);

const payrollActionConditions = computed(() => ({
  edit: (item: Payroll) => item.status === PayrollAllStatus.Pending,
  markPaid: (item: Payroll) => item.status === PayrollAllStatus.Pending,
  markFailed: (item: Payroll) => item.status === PayrollAllStatus.Pending,
  delete: (_item: Payroll) => true,
}));

// --- Initial Data Load ---
onMounted(async () => {
  // Initialize filterPayPeriod in store if not already set
  if (!payrollStore.filterPayPeriod) {
    const now = new Date();
    payrollStore.filterPayPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
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

const handleSavePayroll = async (payrollInput: PayrollInputData | Payroll) => {
  showPayrollDialog.value = false; // Close dialog optimistic
  const actionToTake = isEditingPayroll.value && selectedPayrollForForm.value?.id
    ? payrollStore.updatePayroll(selectedPayrollForForm.value.id, payrollInput as Partial<PayrollInputData>)
    : payrollStore.addPayroll(payrollInput as PayrollInputData);

  try {
    const result = await actionToTake;
    if (result) { // Check if operation returned a payroll object (success)
      // triggerToast({ message: t(isEditingPayroll.value ? 'toast.payroll_updated' : 'toast.payroll_added'), type: 'success' });
      await payrollStore.fetchPayrolls(); // Re-fetch to update the list correctly
    }
    // Error handling can be done here based on store's error state or if actionToTake throws
  } catch (error) { // Catch errors re-thrown by store actions
    // triggerToast({ message: payrollStore.error || t('toast.operation_failed'), type: 'error' });
    console.error("Save payroll failed:", error);
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
    title: t('payroll.delete_payroll_title'),
    message: t('payroll.delete_payroll_confirmation', { name: payroll.employeeName, period: payroll.pay_period }),
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
    // triggerToast({ message: t('toast.payroll_deleted'), type: 'success' });
    // The store's deletePayroll action already updates `allPayrolls` and calls `_applyFiltersAndPagination`
    // So, the view should update reactively.
  } catch (error) {
    // triggerToast({ message: payrollStore.error || t('toast.failed_to_delete_payroll'), type: 'error' });
    console.error("Delete payroll failed:", error);
  } finally {
    deleteDialogActive.value = false;
    closeDeleteDialog();
  }
};

const markPayrollAsPaid = async (payroll: Payroll) => {
  if (!payroll.id) return;
  if (confirm(t('payroll.confirm_mark_paid', { name: payroll.employeeName, period: payroll.pay_period }))) {
    try {
      await payrollStore.processPayment(payroll.id, 'ADMIN_UID_PLACEHOLDER'); // Replace with actual admin UID
      // triggerToast({ message: t('toast.payroll_marked_paid'), type: 'success' });
      await payrollStore.fetchPayrolls(); // Re-fetch to reflect changes accurately
    } catch (error) {
      // triggerToast({ message: payrollStore.error || t('toast.failed_to_mark_paid'), type: 'error' });
      console.error("Mark paid failed:", error);
    }
  }
};

// --- Utility ---
const formatCurrency = (value?: number) => value != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : t('common.na');
const formatDate = (timestamp?: AppTimestamp | Date | null) => {
  if (!timestamp) return t('common.na');
  const date = (timestamp as AppTimestamp)?.toDate ? (timestamp as AppTimestamp).toDate() : new Date(timestamp as Date);
  return date.toLocaleDateString();
};

useHead({ title: () => t('head.payroll_management') }); // For Nuxt, or document.title
</script>