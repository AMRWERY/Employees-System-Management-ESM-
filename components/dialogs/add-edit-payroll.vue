<template>
  <div>
    <!-- Re-using your existing modal structure and classes -->
    <div v-if="modelValue" id="add-edit-payroll-modal">
      <div
        class="fixed inset-0 p-4 flex flex-wrap justify-end items-end w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1 capitalize">
              {{ isEditing ? t('form.edit_payroll_record') : t('form.add_payroll_record') }}
            </h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="closeDialog" />
          </div>

          <!-- Adjusted height for potentially more fields -->
          <div class="my-3 overflow-y-auto h-[calc(500px-88px)] hide-scrollbar">
            <ClientOnly>
              <div class="grid col-span-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <div class="sm:col-span-1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.employee_id') }}</label>
                  <!-- auto-complete-input component -->
                  <auto-complete-input @itemSelected="handleEmployeeSelected"
                    :placeholder="t('form.search_or_enter_employee_id')" :disabled="isEditing"
                    v-model="formValues.uid" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.employee_name')" :placeholder="t('form.enter_employee_name')"
                    type="text" name="name" rules="required|alpha_spaces" :required="true" :disabled="isEditing"
                    v-model="formValues.employeeName" />
                </div>

                <div class="sm:col-span-1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.department') }}</label>
                  <select v-model="formValues.department_id" :disabled="isEditing"
                    class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow">
                    <option value="" disabled>{{ t('form.select_department') }}</option>
                    <option v-for="team in availableTeamsForDropdown" :key="team.id" :value="team.id">
                      {{ team.displayName }}
                      <!-- {{ team.name }} -->
                    </option>
                  </select>
                </div>

                <div class="sm:col-span-1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.pay_period_yyyy_mm')
                  }}</label>
                  <!-- date-picker component-->
                  <date-picker v-model="formValues.pay_period" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.base_salary')" :placeholder="t('form.enter_amount')" type="number"
                    :name="t('form.base_salary')" rules="required|min_value:0" :required="true"
                    v-model="formValues.base_salary" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.working_days')" :placeholder="t('form.enter_working_days')"
                    type="number" :name="t('form.working_days')" rules="required|min_value:0|integer" :required="true"
                    v-model="formValues.working_days" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.days_present')" :placeholder="t('form.enter_days')" type="number"
                    :name="t('form.days_present')" rules="required|min_value:0|integer" :required="true"
                    v-model="formValues.days_present" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.overtime_hours')" :placeholder="t('form.enter_hours')" type="number"
                    :name="t('form.overtime_hours')" rules="required|min_value:0" v-model="formValues.overtime_hours" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.overtime_rate')" :placeholder="t('form.enter_rate')" type="number"
                    :name="t('form.overtime_rate')" rules="required|min_value:0" v-model="formValues.overtime_rate" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.bonuses')" :placeholder="t('form.enter_amount')" type="number"
                    :name="t('form.bonuses')" rules="required|min_value:0" v-model="formValues.bonuses" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.deductions')" :placeholder="t('form.enter_amount')" type="number"
                    :name="t('form.deductions')" rules="required|min_value:0" v-model="formValues.deductions" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.tax_percent')" :placeholder="t('form.enter_percentage')" type="number"
                    :name="t('form.tax_percent')" rules="required|min_value:0|max_value:100"
                    v-model="formValues.tax_percent" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.notes')" :placeholder="t('form.enter_your_notes')" type="textarea"
                    name="notes" v-model="formValues.notes" />
                </div>
              </div>
            </ClientOnly>
          </div>

          <div class="border-t border-gray-300 pt-3 flex justify-end gap-4">
            <base-button :default-icon="false" type="submit" :loading="loading" @click="handleSubmit">
              <!-- Using VeeValidate, submit is handled by Form component, button type="button" -->
              <icon name="svg-spinners:90-ring-with-bg" v-if="loading" />
              <span v-else>{{ isEditing ? t('btn.save_changes') : t('btn.add_record') }}</span>
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Payroll, PayrollInputData } from '@/types/payroll';
import type { Employee } from '@/types/employee';

const { t } = useI18n();
const { triggerToast } = useToast();
const { getTeamName } = useTeamName()
const teamsStore = useTeamStore()
const loading = ref(false);

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  payrollData: {
    type: Object as PropType<Payroll | null>,
    default: null
  },
});

const currentUserRole = computed(() => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const userDataString = window.sessionStorage.getItem('user');
    if (userDataString) {
      try {
        const user = JSON.parse(userDataString);
        return user?.uid || '';
      } catch (e) {
        return
      }
    }
  }
  return
});

const emit = defineEmits(['update:modelValue', 'save']);

const formValues = reactive<PayrollInputData>(getInitialFormValues());

function getInitialFormValues(): PayrollInputData {
  return {
    uid: '',
    employeeName: '',
    department_id: '',
    pay_period: new Date().toISOString().substring(0, 7), // Default to current YYYY-MM
    base_salary: 0,
    working_days: 22, // Default value
    days_present: 0,
    overtime_hours: 0,
    overtime_rate: 0,
    bonuses: 0,
    deductions: 0,
    tax_percent: 0,
    created_by: currentUserRole.value,
    notes: '',
  };
}

const resetForm = () => {
  Object.assign(formValues, getInitialFormValues());
};

// Watch for dialog opening/closing and prop changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) { // Dialog is opened
    if (props.isEditing && props.payrollData) {
      // Pre-fill form for editing
      formValues.uid = props.payrollData.uid;
      formValues.employeeName = props.payrollData.employeeName;
      formValues.department_id = props.payrollData.department_id;
      formValues.pay_period = props.payrollData.pay_period;
      formValues.base_salary = props.payrollData.base_salary;
      formValues.working_days = props.payrollData.working_days;
      formValues.days_present = props.payrollData.days_present;
      formValues.overtime_hours = props.payrollData.overtime_hours;
      formValues.overtime_rate = props.payrollData.overtime_rate;
      formValues.bonuses = props.payrollData.bonuses;
      formValues.deductions = props.payrollData.deductions;
      formValues.tax_percent = props.payrollData.tax_percent;
      formValues.created_by = props.payrollData.created_by;
      formValues.notes = props.payrollData.notes || '';
    } else {
      resetForm();
    }
  }
});

onMounted(() => {
  teamsStore.fetchAll();
})

const availableTeamsForDropdown = computed(() => {
  return teamsStore.teams.map(team => ({
    ...team,
    displayName: getTeamName(team.id, team.name)
  }));
});

const handleEmployeeSelected = (selectedEmployee: Employee | undefined) => {
  // console.log("AddEditPayroll: handleEmployeeSelected CALLED with:", JSON.parse(JSON.stringify(selectedEmployee)));
  if (selectedEmployee) {
    // Ensure employeeId is a string before assigning
    if (typeof selectedEmployee.employeeId === 'string' && selectedEmployee.employeeId.trim() !== '') {
      formValues.uid = selectedEmployee.employeeId;
      // console.log("AddEditPayroll: formValues.uid SET to:", formValues.uid);
    } else {
      formValues.uid = '';
      // console.warn("AddEditPayroll: Selected employee missing valid employeeId, formValues.uid CLEARED");
    }
    const firstName = selectedEmployee.firstName || '';
    const lastName = selectedEmployee.lastName || '';
    formValues.employeeName = `${firstName} ${lastName}`.trim();
    // console.log("AddEditPayroll: formValues.employeeName SET to:", formValues.employeeName);
    if (selectedEmployee.teamId && typeof selectedEmployee.teamId === 'string') {
      const teamExistsInDropdown = availableTeamsForDropdown.value.some(
        (team) => team.id === selectedEmployee.teamId
      );
      if (teamExistsInDropdown) {
        formValues.department_id = selectedEmployee.teamId;
        // console.log("AddEditPayroll: formValues.department_id SET to:", formValues.department_id);
      } else {
        formValues.department_id = '';
        // console.warn(`AddEditPayroll: Employee's teamId (${selectedEmployee.teamId}) not found in dropdown. Department CLEARED.`);
      }
    } else {
      formValues.department_id = '';
      // console.log("AddEditPayroll: Employee has no teamId. Department CLEARED.");
    }
  } else {
    formValues.uid = '';
    formValues.employeeName = '';
  }
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    // Emit only the PayrollInputData
    const dataToSave: PayrollInputData = {
      uid: formValues.uid,
      employeeName: formValues.employeeName,
      department_id: formValues.department_id,
      pay_period: formValues.pay_period,
      base_salary: formValues.base_salary,
      working_days: formValues.working_days,
      days_present: formValues.days_present,
      overtime_hours: formValues.overtime_hours,
      overtime_rate: formValues.overtime_rate,
      bonuses: formValues.bonuses,
      deductions: formValues.deductions,
      tax_percent: formValues.tax_percent,
      created_by: formValues.created_by,
      notes: formValues.notes,
    };
    emit('save', dataToSave);
    resetForm();
  } catch (error) {
    triggerToast({
      message: t('toast.operation_failed'),
      type: 'error',
      icon: 'material-symbols:error-rounded'
    })
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  emit('update:modelValue', false);
  resetForm();
};
</script>