<template>
  <div>
    <div v-if="leaveRequest"
      class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
      <div class="w-full max-w-xl bg-white shadow-lg rounded-lg p-4 relative">
        <div class="flex items-center pb-3 border-b border-gray-300">
          <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ $t('dashboard.leave_request_details') }}</h3>
          <icon name="material-symbols:close-small-rounded" @click="$emit('close')"
            class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-red-500" />
        </div>

        <div class="mt-6 space-y-4">
          <!-- Employee Information -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">{{ $t('form.employee_name') }}:</label>
              <p class="mt-1 text-gray-800">{{ leaveRequest.employeeName }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-600">{{ $t('form.employee_id') }}:</label>
              <p class="mt-1 text-gray-800">{{ leaveRequest.userId }}</p>
            </div>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">{{ $t('form.start_date') }}:</label>
              <p class="mt-1 text-gray-800">{{ formatDate(leaveRequest.startDate) }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-600">{{ $t('form.end_date') }}:</label>
              <p class="mt-1 text-gray-800">{{ formatDate(leaveRequest.endDate) }}</p>
            </div>
          </div>

          <!-- Leave Details -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">{{ $t('form.leave_type') }}:</label>
              <p class="mt-1 text-gray-800">{{ $t(`form.${leaveRequest.type}`) }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-600 me-1">{{ $t('form.status') }}:</label>
              <span :class="statusClasses[leaveRequest.status]"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm">
                {{ $t(`status.${leaveRequest.status}`) }}
              </span>
            </div>
          </div>

          <!-- Reason -->
          <div>
            <label class="text-sm font-medium text-gray-600">{{ $t('form.reason_for_leave') }}:</label>
            <p class="mt-1 text-gray-800 whitespace-pre-wrap">{{ leaveRequest.reason }}</p>
          </div>

          <!-- Attachments -->
          <div v-if="leaveRequest.attachments?.length">
            <label class="text-sm font-medium text-gray-600">{{ $t('form.attachments') }}:</label>
            <div class="mt-2 grid grid-cols-3 gap-3">
              <div v-for="(attachment, index) in leaveRequest.attachments" :key="index" class="group relative">
                <nuxt-link :to="attachment" target="_blank" class="block border rounded-lg overflow-hidden">
                  <img :src="attachment" class="w-full h-24 object-cover" alt="attachment">
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
                {{ $t('btn.cancel') }}
              </button>
              <button @click="confirmRejection"
                class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center">
                {{ $t('btn.confirm_rejection') }}
              </button>
            </div>
          </div>

          <div class="!mt-7 flex items-center gap-4 justify-end">
            <button type="button" @click="handleAccept" v-if="hasPermission('leave-management', 'approve')"
              class="px-3.5 py-2 cursor-pointer rounded-lg flex items-center justify-center text-white text-sm font-medium border-none outline-none bg-blue-600 hover:bg-blue-700 active:bg-blue-600">
              {{ $t('btn.accept') }}
              <icon name="material-symbols:check-small-rounded" class="ms-2" />
            </button>
            <button type="button" @click="initiateRejection" v-if="hasPermission('leave-management', 'cancel')"
              class="px-3.5 py-2 cursor-pointer rounded-lg flex items-center justify-center text-white text-sm font-medium border-none outline-none bg-red-600 hover:bg-red-700 active:bg-red-600">
              {{ $t('btn.reject') }}
              <icon name="material-symbols:close-small-rounded" class="ms-2" />
            </button>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'

const props = defineProps<{
  leaveRequest: LeaveRequest | null
}>()

const emit = defineEmits(["close", "accept", "reject"])

const statusClasses = {
  pending: 'text-red-600 bg-red-100 hover:bg-red-200',
  approved: 'text-green-600 bg-green-100 hover:bg-green-200',
  rejected: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
  cancelled: 'text-gray-600 bg-gray-100 hover:bg-gray-200'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const { hasPermission } = usePermissions()

const { t } = useI18n()

const showRejectReason = ref(false)
const rejectionReason = ref('')
const rejectionError = ref(false)

const initiateRejection = () => {
  showRejectReason.value = true
}

const cancelRejection = () => {
  showRejectReason.value = false
  rejectionReason.value = ''
  rejectionError.value = false
}

const handleAccept = () => {
  emit('accept', props.leaveRequest?.id)
  emit('close')
}

const confirmRejection = async () => {
  if (!rejectionReason.value.trim()) {
    rejectionError.value = true
    return
  }
  emit('reject', {
    id: props.leaveRequest?.id,
    reason: rejectionReason.value
  })
  emit('close')
}
</script>