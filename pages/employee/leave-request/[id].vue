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
          <p v-if="leaveRequest.rejectionReason"
            class="mt-1 text-gray-800 whitespace-pre-wrap p-3 bg-red-50 rounded-lg border border-red-100">
            {{ leaveRequest.rejectionReason }}
          </p>
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
      </div>
    </div>

    <!-- Action buttons for employee -->
    <div class="mt-6 flex justify-end" v-if="canWithdraw">
      <button @click="handleWithdraw" :disabled="withdrawLoading"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:bg-red-400 disabled:cursor-not-allowed">
        <icon name="svg-spinners:90-ring-with-bg" v-if="withdrawLoading" class="w-5 h-5" />
        <span v-else>{{ t('btn.withdraw_request') }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'

const { t } = useI18n()
const { triggerToast } = useToast()
const route = useRoute()
const leaveStore = useLeaveRequestsStore()

const leaveRequest = ref<LeaveRequest | null>(null)
const withdrawLoading = ref(false)

// Get user data from session storage
const userData = sessionStorage.getItem('user')
const parsedUserData = userData ? JSON.parse(userData) : null

onMounted(async () => {
  try {
    const request = await leaveStore.getRequestById(route.params.id as string)
    if (request) {
      leaveRequest.value = request
    }
  } catch (error) {
    showError({ statusCode: 500, message: 'Failed to load request' })
  }
})

// Compute if the request can be withdrawn
const canWithdraw = computed(() => {
  if (!leaveRequest.value || !parsedUserData?.uid) return false
  return (
    leaveRequest.value.status === 'pending' && // Only pending requests can be withdrawn
    leaveRequest.value.userId === parsedUserData.uid
  )
})

const handleWithdraw = async () => {
  if (!leaveRequest.value?.id) return
  try {
    withdrawLoading.value = true
    await leaveStore.withdrawRequest(leaveRequest.value.id)
    // Update the local request status
    if (leaveRequest.value) {
      leaveRequest.value.status = 'cancelled'
    }
    triggerToast({
      message: t('toast.leave_request_withdrawn_successfully'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
  } catch (error) {
    triggerToast({
      message: error instanceof Error ? error.message : t('toast.failed_to_withdraw_request'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    withdrawLoading.value = false
  }
}

const statusClasses = {
  pending: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
  approved: 'text-green-600 bg-green-100 hover:bg-green-200',
  rejected: 'text-red-600 bg-red-100 hover:bg-red-200',
  cancelled: 'text-gray-600 bg-gray-100 hover:bg-gray-200'
} as const

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

useHead({
  titleTemplate: () => t('head.my_leave_requests'),
});
</script>