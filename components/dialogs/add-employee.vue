<template>
  <div>
    <div v-if="modelValue" id="add-employee-modal">
      <div
        class="fixed inset-0 p-4 flex flex-wrap justify-end items-end w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1 capitalize">{{ t('dashboard.add_employee') }}</h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500"
              @click="$emit('update:modelValue', false)" />
          </div>

          <div class="my-3 overflow-y-auto h-[calc(408px-88px)] hide-scrollbar">
            <ClientOnly>
              <div class="grid col-span-1 sm:grid-cols-6 gap-x-6 space-y-2">
                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.first_name')" :placeholder="t('form.enter_first_name')" type="text"
                    :name="t('form.first_name')" :rules="'required|alpha_spaces'" :required="true"
                    v-model="formValues.firstName" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.middle_name')" :placeholder="t('form.enter_middle_name')" type="text"
                    :name="t('form.middle_name')" :rules="'required|alpha_spaces'" :required="true"
                    v-model="formValues.middleName" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.last_name')" :placeholder="t('form.enter_last_name')" type="text"
                    :name="t('form.last_name')" :rules="'required|alpha_spaces'" :required="true"
                    v-model="formValues.lastName" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.email')" :placeholder="t('form.enter_email')" type="email"
                    :name="t('form.email')" :rules="'required|email'" :required="true" v-model="formValues.email" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.base_salary')" :placeholder="t('form.enter_base_salary')" type="number"
                    :name="t('form.base_salary')" :rules="'required'" :required="true" v-model="formValues.base_salary" />
                </div>

                <!-- <div class="col-span-full">
                  <dynamic-inputs :label="t('form.net_salary')" :placeholder="t('form.enter_net_salary')" type="number"
                    :name="t('form.net_salary')" :rules="'required'" :required="true" v-model="formValues.netSalary" />
                </div> -->

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.password')" :placeholder="t('form.enter_password')" type="password"
                    :name="t('form.password')" :rules="'required|minLength:7'" :required="true"
                    v-model="formValues.password" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.position')" :placeholder="t('form.enter_position')" type="text"
                    :name="t('form.position')" v-model="formValues.position" />
                </div>

                <div class="col-span-full">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.teams') }}</label>
                  <select v-model="selectedTeam"
                    class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow">
                    <option value="" disabled>{{ t('form.select_team') }}</option>
                    <option v-for="team in teamsStore.teams" :key="team.id" :value="team.id">
                      {{ team.name }}
                    </option>
                  </select>
                </div>

                <div class="col-span-full" v-if="selectedTeam">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.managers') }}</label>
                  <select v-model="selectedManager"
                    class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow">
                    <option value="" disabled>{{ t('form.select_manager') }}</option>
                    <option v-for="manager in filteredManagers" :key="manager.id" :value="manager.id">
                      {{ manager.firstName }} {{ manager.lastName }}
                    </option>
                  </select>
                </div>
              </div>
            </ClientOnly>
          </div>

          <div class="border-t border-gray-300 pt-3 flex justify-end gap-4">
            <!-- base-button component -->
            <base-button :default-icon="false" type="submit" :disabled="loading" @click="handleSubmit">
              <icon name="svg-spinners:90-ring-with-bg" v-if="loading" />
              <span v-else>{{ t('btn.add') }}</span>
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const teamsStore = useTeamStore()
const employeesStore = useEmployeesStore();
const managerssStore = useManagerStore();
const selectedTeam = ref('')
const selectedManager = ref('')
const { triggerToast } = useToast()
const { isLoading: loading, startLoading } = useLoading(3000)

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    if (teamsStore.teams.length === 0) {
      await teamsStore.fetchAll();
    }
    managerssStore.fetchManagers();
  }
  if (!newVal) resetForm();
});

const filteredManagers = computed(() => {
  if (!selectedTeam.value) return managerssStore.managers;
  return managerssStore.managers.filter(manager =>
    manager.teamId === selectedTeam.value
  );
});

// Reset manager when team changes
watch(selectedTeam, (newTeamId) => {
  if (newTeamId) {
    selectedManager.value = '';
  }
});

const formValues = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  password: '',
  position: '',
  base_salary: 0,
  // netSalary: 0,
});

const handleSubmit = async () => {
  try {
    startLoading()
    // console.log('Selected Team:', selectedTeam.value);
    await employeesStore.createEmployee({
      firstName: formValues.firstName,
      middleName: formValues.middleName,
      lastName: formValues.lastName,
      email: formValues.email,
      password: formValues.password,
      position: formValues.position,
      teamId: selectedTeam.value,
      managerId: selectedManager.value,
      base_salary: formValues.base_salary,
      // netSalary: formValues.netSalary,
    });
    emit('update:modelValue', false);
    emit('save');
    triggerToast({
      message: t('toast.employee_added_successfully'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
    resetForm();
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_add_employee'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
  }
};

const resetForm = () => {
  formValues.firstName = '';
  formValues.middleName = '';
  formValues.lastName = '';
  formValues.email = '';
  formValues.password = '';
  formValues.position = '';
  selectedTeam.value = '';
  selectedManager.value = '';
  formValues.base_salary = 0;
  // formValues.netSalary = 0;
};
</script>