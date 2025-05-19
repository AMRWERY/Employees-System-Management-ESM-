<template>
  <div>
    <div class="w-full max-w-3xl bg-white rounded-lg p-4 relative mx-auto border border-gray-200" v-if="leaveRequest">
      <div class="flex items-center pb-3 border-b border-gray-300">
        <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ t('dashboard.leave_request_details') }}</h3>
      </div>

      <div class="mt-6 space-y-4">
        <!-- Employee Information -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-600">{{ t('form.employee_name') }}:</label>
            <p class="mt-1 text-gray-800">{{ leaveRequest.employeeName }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">{{ t('form.employee_id') }}:</label>
            <p v-if="leaveRequest.employeeId" class="mt-1 text-gray-800">{{ leaveRequest.employeeId }}</p>
            <p v-else class="mt-1 text-red-500">{{ t('dashboard.missing_employee_id') }}</p>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-600">{{ t('form.start_date') }}:</label>
            <p class="mt-1 text-gray-800">{{ formatDate(leaveRequest.startDate) }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600">{{ t('form.end_date') }}:</label>
            <p class="mt-1 text-gray-800">{{ formatDate(leaveRequest.endDate) }}</p>
          </div>
        </div>

        <!-- Leave Details -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-600">{{ t('form.leave_type') }}:</label>
            <p class="mt-1 text-gray-800">{{ t(`form.${leaveRequest.type}`) }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-600 me-1">{{ t('form.status') }}:</label>
            <span :class="statusClasses[leaveRequest.status]"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm">
              {{ t(`status.${leaveRequest.status}`) }}
            </span>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-600">{{ t('form.reason_for_leave') }}:</label>
          <p class="mt-1 text-gray-800 whitespace-pre-wrap p-3 bg-gray-100 rounded-lg">{{ leaveRequest.reason }}</p>
        </div>

        <div v-if="leaveRequest?.status === 'rejected'">
          <label class="text-sm font-medium text-gray-600">{{ t('form.rejection_reason') }}:</label>
          <p class="mt-1 text-gray-800 whitespace-pre-wrap p-3 bg-red-50 rounded-lg border border-red-100">{{
            leaveRequest?.rejectionReason
          }}</p>
        </div>

        <!-- Attachments -->
        <div v-if="leaveRequest.attachments?.length">
          <label class="text-sm font-medium text-gray-600">{{ t('form.attachments') }}:</label>
          <div class="mt-2 grid grid-cols-3 gap-3">
            <div v-for="(attachment, index) in leaveRequest.attachments" :key="index" class="group relative">
              <nuxt-link :to="attachment" target="_blank" class="block border rounded-lg overflow-hidden">
                <img :src="attachment" class="w-full h-32 object-cover" alt="attachment">
              </nuxt-link>
            </div>
          </div>
        </div>

        <div v-if="showRejectReason" class="mt-6 space-y-4">
          <div>
            <dynamic-inputs :label="t('form.rejection_reason')" :placeholder="t('form.enter_rejection_reason')"
              type="textarea" :name="t('form.rejection_reason')" :rules="'required'" :required="true"
              v-model="rejectionReason" />
          </div>

          <div class="flex justify-end gap-3">
            <button @click="cancelRejection" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
              {{ t('btn.cancel') }}
            </button>
            <button @click="confirmRejection"
              class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center">
              {{ t('btn.confirm_rejection') }}
            </button>
          </div>
        </div>

        <div class="!mt-7 flex items-center gap-4 justify-end">
          <button type="button" @click="handleAccept" v-if="hasPermission('leave-management', 'approve')"
            :disabled="isAcceptLoading"
            class="px-3.5 py-2 cursor-pointer rounded-lg flex items-center justify-center text-white text-sm font-medium border-none outline-none bg-blue-600 hover:bg-blue-700 active:bg-blue-600">
            <icon name="svg-spinners:90-ring-with-bg" v-if="isAcceptLoading" />
            <span v-else class="flex items-center justify-center">
              {{ t('btn.accept') }}
              <icon name="material-symbols:check-small-rounded" class="ms-2" />
            </span>
          </button>
          <button type="button" @click="handleReject" v-if="hasPermission('leave-management', 'cancel')"
            :disabled="isRejectLoading"
            class="px-3.5 py-2 cursor-pointer rounded-lg flex items-center justify-center text-white text-sm font-medium border-none outline-none bg-red-600 hover:bg-red-700 active:bg-red-600">
            <icon name="svg-spinners:90-ring-with-bg" v-if="isRejectLoading" />
            <span v-else class="flex items-center justify-center">
              {{ t('btn.reject') }}
              <icon name="material-symbols:close-small-rounded" class="ms-2" />
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'

const route = useRoute()
const leaveStore = useLeaveRequestsStore()
const { triggerToast } = useToast()

const leaveRequest = ref<LeaveRequest | null>(null)

onMounted(async () => {
  try {
    const request = await leaveStore.getRequestById(route.params.id as string)
    // console.log('Leave request data:', request)
    if (request) {
      leaveRequest.value = request
      // console.log('Leave request state:', leaveRequest.value)
    }
  } catch (error) {
    // console.error('Error fetching request:', error)
    showError({ statusCode: 500, message: 'Failed to load request' })
  }
})

const emit = defineEmits(["close", "accept", "reject"])

const statusClasses = {
  pending: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
  approved: 'text-green-600 bg-green-100 hover:bg-green-200',
  rejected: 'text-red-600 bg-red-100 hover:bg-red-200',
  cancelled: 'text-gray-600 bg-gray-100 hover:bg-gray-200'
}

const { formatDate } = useDateFormat();

const { hasPermission } = usePermissions()

const { t } = useI18n()

const showRejectReason = ref(false)
const rejectionReason = ref('')
const rejectionError = ref(false)

const cancelRejection = () => {
  showRejectReason.value = false
  rejectionReason.value = ''
  rejectionError.value = false
}

const isAcceptLoading = ref(false);
const isRejectLoading = ref(false);

const handleAccept = async () => {
  try {
    isAcceptLoading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await leaveStore.approveRequest(route.params.id as string);
    leaveRequest.value!.status = 'approved';
    emit('accept');
    triggerToast({
      message: t('toast.leave_request_approved_successfully'),
      type: 'success',
      icon: 'mdi-check-circle',
    });
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_approve_leave_request'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    isAcceptLoading.value = false;
  }
};

const confirmRejection = () => {
  if (!rejectionReason.value.trim()) {
    rejectionError.value = true;
    return;
  }
  showRejectReason.value = false;
};

const handleReject = async () => {
  if (!rejectionReason.value.trim()) {
    showRejectReason.value = true;
    return;
  }
  try {
    isRejectLoading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const requestId = route.params.id as string;
    await leaveStore.rejectRequest(requestId, rejectionReason.value);
    if (leaveRequest.value) {
      leaveRequest.value.status = 'rejected';
      leaveRequest.value.rejectionReason = rejectionReason.value;
    }
    emit('reject', { id: requestId, reason: rejectionReason.value });
    rejectionReason.value = '';
    triggerToast({
      message: t('toast.leave_request_rejected_successfully'),
      type: 'success',
      icon: 'mdi-check-circle',
    });
  } catch (error) {
    // console.error('Rejection Error:', error);
    triggerToast({
      message: t('toast.failed_to_reject_leave_request'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    isRejectLoading.value = false;
  }
};

useHead({
  titleTemplate: () => t('head.leave_management'),
});
</script>