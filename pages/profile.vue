<template>
  <div>
    <section class="w-full overflow-hidden mt-8">
      <div class="w-full mx-auto">
        <!-- User Cover IMAGE -->
        <img src="../public/profile-bg.jpg" alt="User Cover"
          class="w-full xl:h-[20rem] lg:h-[22rem] md:h-[16rem] sm:h-[13rem] h-[9.5rem]" />

        <!-- User Profile Image -->
        <div class="w-full mx-auto flex justify-center">
          <div class="flex flex-col items-center">
            <div v-if="profileStore.imagePreviewUrl"
              class="rounded-full object-cover xl:w-[12rem] xl:h-[12rem] lg:w-[11rem] lg:h-[11rem] md:w-[9rem] md:h-[9rem] sm:w-[8rem] sm:h-[8rem] w-[7rem] h-[7rem] outline outline-2 outline-offset-2 outline-yellow-500 shadow-xl relative xl:bottom-[7rem] lg:bottom-[8rem] md:bottom-[6rem] sm:bottom-[5rem] bottom-[4.3rem]">
              <img :src="profileStore.imagePreviewUrl" class="object-cover w-full h-full rounded-full" />
              <button type="button" v-if="profileStore.imagePreviewUrl" @click="removeImagePreview"
                class="absolute p-0.5 text-white bg-red-500 rounded-full -top-0 -end-0 hover:bg-red-600 flex items-center">
                <icon name="material-symbols:close-small-rounded"></icon>
              </button>
            </div>
            <div v-else
              class="p-4 mb-2 border border-indigo-500 rounded-full shadow-md object-cover xl:w-[12rem] xl:h-[12rem] lg:w-[11rem] lg:h-[11rem] md:w-[9rem] md:h-[9rem] sm:w-[8rem] sm:h-[8rem] w-[7rem] h-[7rem] outline outline-2 outline-offset-2 outline-yellow-500 relative xl:bottom-[7rem] lg:bottom-[8rem] md:bottom-[6rem] sm:bottom-[5rem] bottom-[4.3rem] bg-gray-50">
              <label for="profile-img" class="flex flex-col items-center justify-center h-full gap-2 cursor-pointer">
                <icon name="material-symbols:photo" class="text-indigo-600 w-12 h-12"></icon>
                <p class="font-medium text-center text-gray-600">{{
                  t('dashboard.update_your_img')
                }}</p>
              </label>
            </div>
            <input id="profile-img" type="file" class="hidden" accept="image/*" @change="handleSingleImageUpload" />
          </div>
        </div>

        <div
          class="xl:w-[80%] lg:w-[90%] md:w-[94%] sm:w-[96%] w-[92%] mx-auto flex flex-col gap-4 justify-center items-center relative xl:-top-[6rem] lg:-top-[6rem] md:-top-[4rem] sm:-top-[3rem] -top-[2.2rem]">
          <h1 class="text-center text-gray-800 text-2xl capitalize font-bold">{{ form.firstName }} {{
            form.lastName }}</h1>
          <p
            class="text-center text-gray-800 text-lg capitalize -mt-2 bg-white p-1.5 px-3 shadow-md shadow-[#005fb3] rounded-lg font-semibold border-2 border-gray-300">
            {{ t(`roles.${form.role}`) }}</p>
          <!-- Profile Form -->
          <ClientOnly>
            <div class="w-full max-w-3xl mx-auto space-y-6 bg-white rounded-lg shadow-md p-6">
              <div class="space-y-4">
                <h2 class="text-xl font-semibold text-gray-800 mb-7">{{ t('form.personal_info') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.first_name')" :name="t('form.first_name')" :disabled="true" readonly
                      v-model="form.firstName" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.last_name')" :name="t('form.last_name')" :disabled="true" readonly
                      v-model="form.lastName" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.email')" :name="t('form.email')" :disabled="true" readonly
                      v-model="form.email" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.employee_id')" :name="t('form.employee_id')" :disabled="true"
                      readonly v-model="form.employeeId" />
                  </div>

                  <div class="sm:col-span-3" v-if="form.role === 'employee'">
                    <dynamic-inputs :label="t('form.position')" :name="t('form.position')" :disabled="true" readonly
                      v-model="form.role" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.base_salary')" :name="t('form.base_salary')" :disabled="true"
                      readonly v-model="form.base_salary" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.created_at')" :name="t('form.created_at')" :disabled="true" readonly
                      v-model="form.createdAt" />
                  </div>

                  <div class="sm:col-span-3" v-if="form.role === 'employee' || form.role !== 'admin'">
                    <dynamic-inputs :label="t('form.manager')" :name="t('form.manager')" :disabled="true" readonly
                      :model-value="managerName" />
                  </div>

                  <div class="sm:col-span-3" v-if="form.role !== 'admin'">
                    <dynamic-inputs :label="t('form.department')" :name="t('form.department')" :disabled="true" readonly
                      :model-value="teamName" />
                  </div>

                  <div class="sm:col-span-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      {{ t('form.birth_date') }}
                    </label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- date-picker component -->
                      <date-picker v-model="form.birthDate" class="w-full" />

                      <!-- base-button component -->
                      <base-button @click="saveBirthdate" :disabled="isSavingBirthdate" :type="'submit'"
                        :default-icon="false" class="w-full h-full flex items-center justify-end">
                        <icon v-if="isSavingBirthdate" name="svg-spinners:90-ring-with-bg" class="text-lg" />
                        <span v-else>{{ t('btn.save_birthdate') }}</span>
                      </base-button>
                    </div>
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.status')" :name="t('form.status')" :disabled="true" readonly
                      :model-value="translatedStatus" />
                  </div>
                </div>
              </div>

              <!-- Password Update Section -->
              <div class="pt-4 border-t border-gray-200 space-y-4">
                <h2 class="text-xl font-semibold text-gray-800 mb-7">{{ t('form.change_password') }}</h2>

                <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.new_password')" placeholder="••••••••" type="password"
                      :name="t('form.new_password')" :rules="'required|minLength:7'" :required="true"
                      v-model="form.newPassword" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.confirm_password')" placeholder="••••••••" type="password"
                      :name="t('form.confirm_password')" :rules="'required|minLength:7'" :required="true"
                      v-model="form.confirmPassword" />
                  </div>
                </div>

                <div class="pt-4">
                  <!-- base-button component -->
                  <base-button :default-icon="false" :block="true" :type="'submit'" :disabled="isLoading"
                    @click="updatePassword">
                    <icon name="svg-spinners:90-ring-with-bg" v-if="isLoading" />
                    <span v-else>{{ t('btn.update_password') }}</span>
                  </base-button>
                </div>
              </div>
            </div>
          </ClientOnly>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const profileStore = useProfileStore()
const authStore = useAuthStore()
const teamsStore = useTeamStore()
const managersStore = useManagerStore()
const { triggerToast } = useToast();
const { formatDate } = useDateFormat();
const { getTeamName } = useTeamName()
const isSavingBirthdate = ref(false);

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  employeeId: '',
  position: '',
  createdAt: '',
  role: '',
  teamId: '' as string,
  managerId: '' as string,
  status: '' as 'active' | 'blocked',
  base_salary: 0 as number,
  newPassword: '',
  confirmPassword: '',
  birthDate: null as Date | string | null,
})

const isLoading = computed(() => profileStore.passwordUpdateLoading)

const updatePassword = async () => {
  try {
    const result = await profileStore.updateUserPassword(form.newPassword)
    // Check if we need to handle special case for requires-recent-login
    if (result && !result.success && result.requiresRecentLogin) {
      triggerToast({
        message: t('toast.requires_recent_login'),
        type: 'error',
        icon: 'material-symbols:error-rounded'
      })
      resetForm()
      setTimeout(async () => {
        await authStore.logoutUser()
        navigateTo('/auth/login')
      }, 3000)
      return
    }
    triggerToast({
      message: t('toast.password_updated'),
      type: 'success',
      icon: 'material-symbols:check-circle'
    })
    resetForm()
    setTimeout(async () => {
      await authStore.logoutUser()
      navigateTo('/auth/login')
    }, 3000)
  } catch (error) {
    triggerToast({
      message: t('toast.password_update_failed'),
      type: 'error',
      icon: 'material-symbols:error-rounded'
    })
  }
}

const resetForm = () => {
  form.newPassword = ''
  form.confirmPassword = ''
}

const handleSingleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    profileStore.imagePreviewUrl = e.target?.result as string
  }
  reader.readAsDataURL(file)
  try {
    await profileStore.uploadImage(file)
    triggerToast({
      message: t('toast.successfully_upload_img'),
      type: 'success',
      icon: 'material-symbols:check-circle',
    });
  } catch (error) {
    triggerToast({
      message: t('toast.failed_upload_img'),
      type: 'error',
      icon: 'material-symbols:error-rounded',
    });
  }
}

const removeImagePreview = async () => {
  try {
    await profileStore.removeImage()
    triggerToast({
      message: t('toast.successfully_remove_img'),
      type: 'success',
      icon: 'material-symbols:check-circle',
    });
  } catch (error) {
    triggerToast({
      message: t('toast.failed_remove_img'),
      type: 'error',
      icon: 'material-symbols:error-rounded',
    });
  }
}

const convertToDate = (value: any): Date | null => {
  if (!value) return null;
  // Handle Firestore Timestamp
  if (typeof value === 'object' && 'toDate' in value) {
    return value.toDate();
  }
  // Handle ISO strings
  if (typeof value === 'string') {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    } catch (e) {
      console.error('Date conversion error:', e);
    }
  }
  // Return Date objects directly
  if (value instanceof Date) return value;
  return null;
};

onMounted(async () => {
  profileStore.initializeProfileImage();
  if (managersStore.managers.length === 0) {
    await managersStore.fetchManagers();
  }
  if (teamsStore.teams.length === 0) {
    await teamsStore.fetchAll();
  }
  const loadEmployeeData = async () => {
    try {
      const userId = authStore.user?.uid;
      if (!userId) return;
      const employee = await teamsStore.fetchEmployeeById(userId);
      if (!employee) return;
      // Get sessionStorage user data
      const sessionUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      // Update all form fields from employee data with fallbacks
      form.firstName = employee.firstName || authStore.user?.firstName || sessionUser.firstName || "";
      form.lastName = employee.lastName || authStore.user?.lastName || sessionUser.lastName || "";
      form.email = employee.email || authStore.user?.email || sessionUser.email || "";
      form.employeeId = employee.employeeId || authStore.user?.employeeId || sessionUser.employeeId || "";
      form.position = employee.position || "";
      form.createdAt = employee.createdAt ? formatDate(employee.createdAt) : "";
      form.role = employee.role || authStore.user?.role || sessionUser.role || "";
      form.teamId = employee.teamId || authStore.user?.teamId || sessionUser.teamId || "";
      form.managerId = employee.managerId || authStore.user?.managerId || sessionUser.managerId || "";
      form.status = employee.status || authStore.user?.status || sessionUser.status || "active";
      form.base_salary = employee.base_salary || authStore.user?.base_salary || sessionUser.base_salary || 0;
      form.birthDate = convertToDate(employee.birthDate)
        || convertToDate(authStore.user?.birthDate)
        || convertToDate(sessionUser.birthDate)
        || null;
    } catch (error) {
      triggerToast({
        message: t("toast.failed_fetch_profile"),
        type: "error",
        icon: "material-symbols:error-rounded",
      });
    }
  };
  await loadEmployeeData();
});

const teamName = computed(() => getTeamName(form.teamId))

const managerName = computed(() => {
  if (!form.managerId) return t("dashboard.not_assigned");
  const manager = managersStore.managers.find(m => m.id === form.managerId);
  return manager ? `${manager.firstName} ${manager.lastName}` : t("dashboard.not_assigned");
})

const translatedStatus = computed(() => {
  if (!form.status) return ''
  return t(`status.${form.status}`)
})

const saveBirthdate = async () => {
  isSavingBirthdate.value = true;
  try {
    await authStore.saveProfile(null, form.birthDate);
    triggerToast({
      message: t('toast.birthdate_updated'),
      type: 'success',
      icon: 'material-symbols:check-circle'
    });
  } catch (error) {
    triggerToast({
      message: t('toast.birthdate_update_failed'),
      type: 'error',
      icon: 'material-symbols:error-rounded'
    });
  } finally {
    isSavingBirthdate.value = false;
  }
};

useHead({
  titleTemplate: () => t('head.profile'),
});
</script>