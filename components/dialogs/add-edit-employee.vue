<template>
  <div>
    <dynamic-dialog id="add-edit-employee-modal" v-model="visibleProxy"
      :title="isEditing ? t('dashboard.edit_employee') : t('dashboard.add_employee')"
      :data="{ formValues, selectedTeam, selectedManager, teams: teamsStore.teams, filteredManagers, loading, isEditing }"
      @close="emit('update:modelValue', false)">
      <template #default>
        <div class="my-3 overflow-y-auto h-[calc(508px-88px)] hide-scrollbar">
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
                  :name="t('form.email')" :rules="'required|email'" :required="true" v-model="formValues.email"
                  :disabled="isEditing" />
              </div>
              <div class="col-span-full">
                <dynamic-inputs :label="t('form.base_salary')" :placeholder="t('form.enter_base_salary')" type="number"
                  :name="t('form.base_salary')" :rules="'required'" :required="true" v-model="formValues.base_salary" />
              </div>
              <div class="col-span-full" v-if="!isEditing">
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
      </template>
      <template #footer>
        <base-button :default-icon="false" type="submit" :disabled="loading" @click="handleSubmit">
          <icon name="svg-spinners:90-ring-with-bg" v-if="loading" />
          <span v-else>{{ isEditing ? t('btn.save_changes') : t('btn.add') }}</span>
        </base-button>
      </template>
    </dynamic-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { Employee } from '@/types/employee'

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
  },
  employeeData: {
    type: Object as PropType<Employee | null>,
    // default: null
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const isEditing = ref(false);

const visibleProxy = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) emit('update:modelValue', false)
  }
})

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

watch(
  () => props.employeeData,
  (newEmployeeData) => {
    isEditing.value = !!newEmployeeData;
    if (newEmployeeData) {
      // Pre-fill form for editing
      Object.assign(formValues, {
        firstName: newEmployeeData.firstName || '',
        middleName: newEmployeeData.middleName || '',
        lastName: newEmployeeData.lastName || '',
        email: newEmployeeData.email || '',
        position: newEmployeeData.position || '',
        base_salary: newEmployeeData.base_salary || 0,
      });
      selectedTeam.value = newEmployeeData.teamId || '';
      selectedManager.value = newEmployeeData.managerId || '';
    } else {
      // Reset form for add mode
      resetForm();
    }
  },
  { immediate: true }
);

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    resetForm();
  }
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

const handleSubmit = async () => {
  try {
    startLoading()
    if (isEditing.value && props.employeeData && props.employeeData.id) {
      // Update employee
      await employeesStore.updateEmployee(props.employeeData.id, {
        firstName: formValues.firstName,
        middleName: formValues.middleName,
        lastName: formValues.lastName,
        email: formValues.email,
        position: formValues.position,
        teamId: selectedTeam.value,
        managerId: selectedManager.value,
        base_salary: formValues.base_salary,
      })
      emit('save', { ...formValues, id: props.employeeData.id })
      triggerToast({
        message: t('toast.employee_updated_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      })
    } else {
      // Add employee
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
      })
      emit('save')
      triggerToast({
        message: t('toast.employee_added_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      })
    }
    emit('update:modelValue', false)
    resetForm();
  } catch (error) {
    triggerToast({
      message: isEditing.value ? t('toast.failed_to_update_employee') : t('toast.failed_to_add_employee'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
  }
}
</script>