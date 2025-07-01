<template>
  <div>
    <div id="add-edit-performance-review-modal">
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
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.employee') }}</label>
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


                <!-- <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t('form.review_period') }}
                </label>
                <select v-model="formValues.review_period" class="w-full p-2 border rounded-lg">
                  <option v-for="period in reviewPeriods" :key="period" :value="period">
                    {{ period }}
                  </option>
                </select>
              </div> -->
              </div>
            </ClientOnly>

            <!-- Reviewer Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('form.reviewer') }}
              </label>
              <select v-model="formValues.reviewer_id" class="w-full p-2 border rounded-lg">
                <option v-for="reviewer in reviewers" :key="reviewer.id" :value="reviewer.id">
                  {{ reviewer.firstName }} {{ reviewer.lastName }} ({{ reviewer.position }})
                </option>
              </select>
            </div>

            <!-- Ratings -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800">{{ t('form.ratings') }}</h4>

              <div v-for="(rating, key) in formValues.ratings" :key="key" class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 capitalize">
                  {{ t(`performance.${key}`) }}
                </label>
                <div class="flex items-center gap-2 w-48">
                  <input type="range" min="1" max="5" v-model.number="formValues.ratings[key]"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                  <span class="text-sm font-medium w-6 text-center">{{ formValues.ratings[key] }}</span>
                </div>
              </div>

              <div class="flex justify-between items-center mt-4 pt-4 border-t">
                <span class="text-base font-medium text-gray-800">{{ t('form.overall_score') }}</span>
                <span class="text-xl font-bold text-blue-600">{{ overallScore }}%</span>
              </div>
            </div>

            <!-- Text Areas -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t('form.strengths') }}
                </label>
                <textarea v-model="formValues.strengths" rows="4"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t('form.improvements') }}
                </label>
                <textarea v-model="formValues.improvements" rows="4"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
            </div>

            <!-- Comments -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('form.comments') }}
              </label>
              <textarea v-model="formValues.comments" rows="3"
                class="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
          </div>

          <div class="border-t border-gray-300 pt-6 flex justify-end gap-4">
            <button type="button"
              class="px-4 py-2 rounded-lg text-white text-sm font-medium border-none outline-none tracking-wide bg-blue-600 hover:bg-blue-700 active:bg-blue-600"
              @click="submitForm">
              {{ t('btn.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PerformanceReview, Rating } from '@/types/employees-performance'
import type { Employee } from '@/types/employee';

const { t } = useI18n();
const authStore = useAuthStore()
const employeeStore = useEmployeesStore()
const managerStore = useManagerStore()

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

// Predefined review periods
const reviewPeriods = ref([
  'Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2024',
  'Q1-2025', 'Q2-2025', 'Q3-2025', 'Q4-2025'
]);

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

// Watch for dialog opening
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.isEditing && props.reviewData) {
      // Pre-fill form for editing
      Object.assign(formValues, props.reviewData);
    } else {
      // Set default values for new review
      resetForm();
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
  formValues.reviewer_id = authStore.user?.id || '';
});

function resetForm() {
  formValues.employee_id = '';
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
  // Create a copy to avoid reactivity issues
  const reviewData = { ...formValues };
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
</script>