<template>
  <div>
    <div id="add-edit-performance-review-modal" v-if="modelValue">
      <div
        class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">
              {{ isEditing ? t('form.edit_review') : t('form.add_review') }}
            </h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="closeDialog" />
          </div>

          <div class="my-3 overflow-y-auto h-[calc(500px-88px)] hide-scrollbar">
            <ClientOnly>
              <div class="grid col-span-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <div class="sm:col-span-1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.employee_id') }}</label>
                  <!-- auto-complete-input component -->
                  <auto-complete-input @itemSelected="handleEmployeeSelected"
                    :placeholder="t('form.search_or_enter_employee_id')" :disabled="isEditing"
                    v-model="formValues.employee_id" />
                </div>

                <div class="sm:col-span-1">
                  <dynamic-inputs :label="t('form.employee_name')" :placeholder="t('form.enter_employee_name')"
                    type="text" :name="t('form.employee_name')" rules="required|alpha_spaces" :required="true"
                    :disabled="isEditing" v-model="formValues.employee_name" />
                </div>

                <div class="sm:col-span-1">
                  <!-- select-input component -->
                  <select-input v-model="formValues.reviewer_id" :options="reviewerOptions" :label="t('form.reviewer')"
                    :placeholder="t('form.select_reviewer')" />
                </div>

                <div class="sm:col-span-1">
                  <!-- select-input component -->
                  <select-input v-model="formValues.review_period" :options="reviewPeriodOptions"
                    :label="t('form.review_period')" :placeholder="t('form.select_period')" />
                </div>
              </div>

              <!-- Ratings -->
              <div class="space-y-4 mt-6 border-t py-5">
                <h4 class="text-lg font-medium text-gray-800">{{ t('form.ratings') }}</h4>
                <!-- range-input component -->
                <range-input :ratings="formValues.ratings" />
                <div class="flex justify-between items-center mt-4 pb-4 border-b">
                  <span class="text-base font-medium text-gray-800">{{ t('dashboard.overall_score') }}</span>
                  <span class="text-xl font-bold text-blue-600">{{ overallScore }}%</span>
                </div>
              </div>

              <div class="sm:col-span-1">
                <dynamic-inputs :label="t('form.strengths')" type="textarea" :required="true"
                  :name="t('form.strengths')" rules="required" v-model="formValues.strengths" />
              </div>

              <div class="sm:col-span-1">
                <dynamic-inputs :label="t('form.improvements')" type="textarea" :required="true"
                  :name="t('form.improvements')" rules="required" v-model="formValues.improvements" />
              </div>

              <div class="sm:col-span-1">
                <dynamic-inputs :label="t('form.comments')" type="textarea" :required="true" :name="t('form.comments')"
                  rules="required" v-model="formValues.comments" />
              </div>
            </ClientOnly>
          </div>

          <div class="border-t border-gray-300 pt-6 flex justify-end gap-4">
            <!-- base-button component -->
            <base-button :default-icon="false" :type="'submit'" :disabled="loading" @click="submitForm">
              {{ isEditing ? t('btn.save') : t('btn.add') }}
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PerformanceReview, Rating, SelectOption } from '@/types/employees-performance'
import type { Employee } from '@/types/employee';

const { t } = useI18n();
const authStore = useAuthStore()
const employeeStore = useEmployeesStore()
const managerStore = useManagerStore()
const { isLoading: loading, startLoading } = useLoading(3000)

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  reviewData: {
    type: Object as PropType<PerformanceReview | null>,
    default: null
  },
});

const emit = defineEmits(['update:modelValue', 'save']);

// Form structure
const formValues = reactive<PerformanceReview>({
  employee_id: '',
  employee_name: '',
  review_period: '',
  reviewer_id: '',
  ratings: {
    communication: 3,
    productivity: 3,
    teamwork: 3,
    problem_solving: 3
  },
  comments: '',
  strengths: '',
  improvements: '',
  overall_score: 0,
  created_at: new Date()
});

const generateReviewPeriods = (startYear: number, endYear: number): string[] => {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const result: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    for (const q of quarters) {
      result.push(`${q}-${year}`);
    }
  }
  return result;
};

const currentYear = new Date().getFullYear();
const reviewPeriods = ref<string[]>(generateReviewPeriods(currentYear, currentYear + 5));

const quarterMap: Record<string, string> = {
  Q1: t('dashboard.quarter_1'),
  Q2: t('dashboard.quarter_2'),
  Q3: t('dashboard.quarter_3'),
  Q4: t('dashboard.quarter_4'),
};

const reviewPeriodOptions = computed<SelectOption[]>(() => {
  return reviewPeriods.value.map(period => {
    const [quarter, year] = period.split('-');
    const translatedQuarter = quarterMap[quarter] || quarter;
    return {
      value: period,
      label: `${translatedQuarter} - ${year}`,
    };
  });
});

// Employees for selection
const employees = ref<any[]>([]);
// Reviewers (managers + HR admins)
const reviewers = ref<any[]>([]);

// Calculate overall score as percentage
const overallScore = computed(() => {
  const ratingKeys = Object.keys(formValues.ratings);
  const total = ratingKeys.reduce((sum, key) => sum + formValues.ratings[key as keyof Rating], 0);
  const maxPossible = ratingKeys.length * 5;
  return Math.round((total / maxPossible) * 100);
});

// Watch for changes to update overall score
watch(overallScore, (newScore) => {
  formValues.overall_score = newScore;
});

const getCurrentQuarter = (): string => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `Q${quarter}-${now.getFullYear()}`;
}

// Watch for dialog opening
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.isEditing && props.reviewData) {
      // Pre-fill form for editing
      Object.assign(formValues, props.reviewData);
    } else {
      // Set default values for new review
      resetForm();
      formValues.review_period = getCurrentQuarter()
    }
  }
});

// Fetch data when component is mounted
onMounted(async () => {
  await employeeStore.fetchEmployees();
  await managerStore.fetchManagers();

  // Set employees for dropdown
  employees.value = employeeStore.employees.map(e => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    employeeId: e.employeeId
  }));

  // Set reviewers (managers + current user if admin)
  reviewers.value = managerStore.managers.map(m => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    position: m.position
  }));

  // Add current user if admin
  if (authStore.user?.role === 'admin') {
    reviewers.value.push({
      id: authStore.user.id,
      firstName: authStore.user.firstName,
      lastName: authStore.user.lastName,
      position: 'Admin'
    });
  }
  // Set default reviewer to current user
  if (!authStore.user?.id) return;
  formValues.reviewer_id = authStore.user.id;
});

const resetForm = () => {
  formValues.employee_id = '';
  formValues.employee_name = '';
  formValues.review_period = '';
  formValues.review_period = reviewPeriods.value[reviewPeriods.value.length - 1];
  formValues.reviewer_id = authStore.user?.id || '';
  formValues.ratings = {
    communication: 3,
    productivity: 3,
    teamwork: 3,
    problem_solving: 3
  };
  formValues.comments = '';
  formValues.strengths = '';
  formValues.improvements = '';
  formValues.overall_score = 0;
  formValues.created_at = new Date();
}

const submitForm = () => {
  if (!formValues.reviewer_id) {
    formValues.reviewer_id = authStore.user?.id || '';
  }
  const reviewData: PerformanceReview = {
    ...formValues,
    created_at: new Date()
  };
  // const reviewData = { ...formValues };
  emit('save', reviewData);
};

const closeDialog = () => {
  emit('update:modelValue', false);
  resetForm();
};

const handleEmployeeSelected = (selectedEmployee: Employee | undefined) => {
  if (selectedEmployee) {
    // Use optional chaining and nullish coalescing to handle potential undefined
    formValues.employee_id = selectedEmployee.employeeId ?? '';
    formValues.employee_name = `${selectedEmployee.firstName ?? ''} ${selectedEmployee.lastName ?? ''}`.trim();
  } else {
    formValues.employee_id = '';
    formValues.employee_name = '';
  }
};

const reviewerOptions = computed<SelectOption[]>(() => {
  return reviewers.value.map(reviewer => {
    // Format the label: "FirstName LastName (Position)" or just "FirstName LastName" if no position
    const baseName = `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim();
    const label = reviewer.position
      ? `${baseName} (${reviewer.position})`
      : baseName;
    return {
      value: reviewer.id,
      label: label
    };
  });
});
</script>