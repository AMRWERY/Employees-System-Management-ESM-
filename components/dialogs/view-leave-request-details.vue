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
          <div class="grid grid-cols-2 gap-4">
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

const emit = defineEmits(['close'])

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
</script>