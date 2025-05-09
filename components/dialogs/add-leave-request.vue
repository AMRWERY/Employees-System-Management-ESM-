<template>
  <div>
    <button role="button" @click="showModal = true"
      class="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center gap-2">
      <icon name="heroicons-solid:plus" class="w-5 h-5" />
      {{ $t('btn.add_request') }}
    </button>

    <div v-if="showModal"
      class="fixed inset-0 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
      <div class="w-full max-w-xl bg-white shadow-lg rounded-lg p-4 relative">
        <div class="flex items-center pb-3 border-b border-gray-300">
          <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ $t('form.leave_request_form') }}</h3>
          <button role="button" @click="showModal = false">
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div class="mt-6 overflow-y-auto hide-scrollbar max-h-[calc(85vh-8rem)]">
          <form class="space-y-6" @submit.prevent="submitForm">
            <!-- Employee Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                <input type="text" v-model="form.employeeName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <input type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- Leave Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
              <select v-model="form.leaveType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Select Leave Type</option>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="parental">Parental Leave</option>
                <option value="bereavement">Bereavement Leave</option>
                <option value="medical">Medical Leave</option>
              </select>
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <!-- date-picker component-->
                <date-picker v-model="form.startDate" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <!-- date-picker component-->
                <date-picker v-model="form.endDate" />
              </div>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Total Days Requested</label>
              <input type="number" v-model="form.duration"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter number of days">
            </div>

            <!-- Reason -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Reason for Leave</label>
              <textarea rows="4" v-model="form.reason"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please describe the reason for your leave"></textarea>
            </div>

            <!-- Attachments -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Attachments (if any)</label>
              <div
                class="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-md p-6">
                <input type="file" class="hidden" id="fileInput" multiple @change="handleFileUpload">
                <label for="fileInput" class="cursor-pointer text-gray-500 hover:text-blue-600">
                  <icon name="mdi:cloud-upload-outline" class="w-6 h-6 me-2" />
                  <span>Click to upload documents</span>
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" :disabled="loading"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
              <icon name="svg-spinners:90-ring-with-bg" v-if="loading" />
              <span v-else>Submit Leave Request</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- dynamic-toast component -->
    <div class="fixed z-50 pointer-events-none bottom-5 end-1 w-96">
      <div class="pointer-events-auto">
        <dynamic-toast v-if="showToast" :message="toastMessage" :toastType="toastType" :duration="5000"
          :toastIcon="toastIcon" @toastClosed="showToast = false" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'

const { t } = useI18n();
const { showToast, toastMessage, toastType, toastIcon, triggerToast } = useToast();

const leaveStore = useLeaveRequestsStore()
const showModal = ref(false)
const loading = ref(false)
const attachments = ref<File[]>([])

const form = reactive({
  employeeName: '',
  leaveType: '',
  startDate: null as Date | null,
  endDate: null as Date | null,
  duration: '',
  reason: '',
})

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    attachments.value = Array.from(input.files)
  }
}

const submitForm = async () => {
  const userData = sessionStorage.getItem('user')
  const parsedUserData = userData ? JSON.parse(userData) : null
  if (!parsedUserData?.uid) return
  else if (!form.startDate || !form.endDate) return;
  if (!form.employeeName || !form.leaveType) return;
  try {
    loading.value = true
    const requestData: Omit<LeaveRequest, 'id'> = {
      userId: parsedUserData?.uid,
      employeeName: form.employeeName,
      startDate: form.startDate,
      endDate: form.endDate,
      type: form.leaveType,
      reason: form.reason,
      status: 'pending',
      submittedAt: new Date(),
      durationDays: parseInt(form.duration),
      attachments: [] as string[], // To store download URLs
    }
    // Upload attachments if any
    if (attachments.value.length > 0) {
      try {
        const urls = await Promise.all(
          attachments.value.map(file => {
            if (!parsedUserData.uid) {
              throw new Error('User authentication required for file upload');
            }
            return leaveStore.uploadAttachment(file);
          })
        );
        requestData.attachments = urls;
      } catch (error) {
        triggerToast({
          message: 'Failed to upload attachments: ' + (error instanceof Error ? error.message : 'Unknown error'),
          type: 'error',
          icon: 'material-symbols:error-outline-rounded',
        });
        return;
      }
    }
    await leaveStore.submitRequest(requestData)
    triggerToast({
      message: t('toast.leave_request_submitted_successfull'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
    showModal.value = false
    resetForm()
  } catch (error) {
    triggerToast({
      message: error instanceof Error ? error.message : t('toast.failed_to_submit_request'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.leaveType = ''
  form.startDate = null
  form.endDate = null
  form.duration = ''
  form.reason = ''
  attachments.value = []
}
</script>