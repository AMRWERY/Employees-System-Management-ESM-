<template>
  <div>
    <!-- base-btn componenet -->
    <base-button :default-icon="false" :type="'button'" @click="showModal = true">
      {{ t('btn.add_request') }}
    </base-button>

    <div v-if="showModal"
      class="fixed inset-0 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
      <div class="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 relative">
        <div class="flex items-center pb-3 border-b border-gray-300">
          <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ t('form.leave_request_form') }}</h3>
          <button role="button" @click="showModal = false">
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div class="mt-6 overflow-y-auto hide-scrollbar max-h-[calc(85vh-8rem)]">
          <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
            <ClientOnly>
              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('form.employee_name')" :name="t('form.employee_name')" :disabled="true"
                  readonly v-model="form.employeeName" />
              </div>

              <div class="sm:col-span-3">
                <dynamic-inputs :label="t('form.employee_id')" :name="t('form.employee_id')" :disabled="true" readonly
                  v-model="form.employeeId" />
              </div>

              <div class="sm:col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.leave_type') }}</label>
                <select v-model="form.leaveType"
                  class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow">
                  <option value="" disabled>{{ t('form.select_leave_type') }}</option>
                  <option value="vacation">{{ t('form.vacation') }}</option>
                  <option value="sick">{{ t('form.sick_leave') }}</option>
                  <option value="parental">{{ t('form.parental_leave') }}</option>
                  <option value="bereavement">{{ t('form.bereavement_leave') }}</option>
                  <option value="medical">{{ t('form.medical_leave') }}</option>
                </select>
              </div>

              <div class="sm:col-span-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.start_date') }}</label>
                <!-- date-picker component-->
                <date-picker v-model="form.startDate" />
              </div>

              <div class="sm:col-span-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.end_date') }}</label>
                <!-- date-picker component-->
                <date-picker v-model="form.endDate" />
              </div>

              <div class="sm:col-span-full">
                <dynamic-inputs :label="t('form.total_days_requested')" :placeholder="t('form.enter_number_of_days')"
                  type="number" :name="t('form.total_days_requested')" :rules="'required|max_value:15'" :required="true"
                  v-model="form.duration" />
              </div>

              <div class="sm:col-span-full">
                <dynamic-inputs :label="t('form.reason_for_leave')"
                  :placeholder="t('form.please_describe_the_reason_for_your_leave')" type="textarea"
                  :name="t('form.reason_for_leave')" :rules="'required'" :required="true" v-model="form.reason" />
              </div>

              <div class="sm:col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.attachments') }}</label>
                <div
                  class="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-md p-6 h-28">
                  <input type="file" class="hidden" id="fileInput" multiple @change="handleFileUpload">
                  <label for="fileInput"
                    class="cursor-pointer text-gray-500 hover:text-blue-600 flex flex-col items-center justify-center gap-2">
                    <icon name="mdi:cloud-upload-outline" class="w-12 h-12" />
                    <span class="text-center">{{ t('form.click_to_upload_documents') }}</span>
                  </label>
                </div>

                <!-- Attachments list -->
                <div v-if="attachments.length > 0" class="mt-6 grid grid-cols-3 gap-4">
                  <div v-for="(file, index) in attachments" :key="index" class="relative group w-32 h-28 mx-auto">
                    <img :src="previews[index]" class="w-full h-28 object-cover rounded-lg border border-gray-200"
                      :alt="file.name">
                    <button @click="removeAttachment(index)"
                      class="absolute p-1 text-white bg-red-500 rounded-full -top-2 -end-2 hover:bg-red-600 flex items-center">
                      <icon name="material-symbols:close" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="sm:col-span-full">
                <button type="submit" :disabled="loading" @click="submitForm"
                  class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
                  <icon name="svg-spinners:90-ring-with-bg" v-if="loading" />
                  <span v-else>{{ t('btn.submit_leave_request') }}</span>
                </button>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { LeaveRequest } from '@/types/leaveRequest'

const { t } = useI18n();
const { triggerToast } = useToast()

const leaveStore = useLeaveRequestsStore()
const showModal = ref(false)
const loading = ref(false)

// Get user data from session storage
const userData = sessionStorage.getItem('user')
const parsedUserData = userData ? JSON.parse(userData) : null

const form = reactive({
  employeeName: parsedUserData?.firstName + ' ' + parsedUserData?.lastName || '',
  employeeId: parsedUserData?.employeeId || '',
  leaveType: '',
  startDate: null as Date | null,
  endDate: null as Date | null,
  duration: '',
  reason: '',
})

const attachments = ref<File[]>([]);
const previews = ref<string[]>([]);
const fileInputKey = ref(0);

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    const files = Array.from(input.files);
    attachments.value = [...attachments.value, ...files];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.value.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
    fileInputKey.value++;
  }
};

const removeAttachment = (index: number) => {
  URL.revokeObjectURL(previews.value[index]);
  attachments.value.splice(index, 1);
  previews.value.splice(index, 1);
  fileInputKey.value++;
};

const submitForm = async () => {
  const userData = sessionStorage.getItem('user')
  const parsedUserData = userData ? JSON.parse(userData) : null
  // console.log('User data from session:', parsedUserData)
  if (!parsedUserData?.uid) return
  else if (!form.startDate || !form.endDate) return;
  if (!form.employeeName || !form.leaveType || !form.employeeId) {
    // console.log('Form validation failed:', form)
    triggerToast({
      message: t('toast.please_fill_all_required_fields'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
    return;
  }
  try {
    loading.value = true
    const requestData: Omit<LeaveRequest, 'id'> = {
      userId: parsedUserData?.uid,
      employeeId: form.employeeId,
      employeeName: form.employeeName,
      startDate: form.startDate,
      endDate: form.endDate,
      type: form.leaveType,
      reason: form.reason,
      status: 'pending',
      submittedAt: new Date(),
      durationDays: parseInt(form.duration),
      attachments: [] as string[], // To store download URLs
      managerId: parsedUserData?.managerId || null,
      teamId: parsedUserData?.teamId || null,
    }
    // console.log('Submitting request with data:', requestData)
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
          message: t('toast.failed_to_upload_attachments') + (error instanceof Error ? error.message : 'Unknown error'),
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
  // Keep the employeeId from sessionStorage
  const savedEmployeeId = form.employeeId
  const savedEmployeeName = form.employeeName

  // Reset all fields
  form.leaveType = ''
  form.startDate = null
  form.endDate = null
  form.duration = ''
  form.reason = ''
  attachments.value = []

  // Restore employee info
  form.employeeId = savedEmployeeId
  form.employeeName = savedEmployeeName
}

onUnmounted(() => {
  previews.value.forEach(url => URL.revokeObjectURL(url));
});
</script>