<template>
  <div>
    <div class="px-4 sm:px-6 lg:px-8 py-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ t('dashboard.employee_performance_details') }} <span class="underline text-blue-700">({{ employeeFullName
              }})</span>
          </h1>
        </div>

        <div class="flex gap-3">
          <base-button :default-icon="false">
            {{ t('btn.new_review') }}
          </base-button>

          <!-- refresh-data-btn component -->
          <!-- <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" /> -->
        </div>
      </div>

      <!-- dynamic-tabs component -->
      <dynamic-tabs :tabs="tabs" v-model:activeTab="activeTab" />

      <!-- Tab content -->
      <div class="mt-4">
        <!-- Performance Reviews -->
        <div v-if="activeTab === 'reviews'" class="bg-white rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewer
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(review, index) in performanceReviews" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ review.review_period }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-16 bg-gray-200 rounded-full h-2.5 me-2">
                        <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${review.overall_score}%` }">
                        </div>
                      </div>
                      <span class="text-sm font-medium text-gray-900">{{ review.overall_score }}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(review.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ review.reviewer_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 me-3">View</button>
                    <button class="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- KPI Tracker -->
        <div v-if="activeTab === 'kpi'" class="bg-white rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KPI
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(kpi, index) in kpis" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ kpi.name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ kpi.target }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ kpi.actual }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="{
                      'text-green-600': kpi.result >= 80,
                      'text-yellow-600': kpi.result >= 60 && kpi.result < 80,
                      'text-red-600': kpi.result < 60
                    }" class="text-sm font-medium">
                      {{ kpi.result }}%
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ kpi.period }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Goals -->
        <div v-if="activeTab === 'goals'" class="bg-white rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goal
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Date
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(goal, index) in goals" :key="index">
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ goal.title }}</div>
                    <div class="text-sm text-gray-500 mt-1">{{ goal.description }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(goal.target_date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="{
                      'bg-blue-100 text-blue-800': goal.status === 'In Progress',
                      'bg-green-100 text-green-800': goal.status === 'Achieved',
                      'bg-gray-100 text-gray-800': goal.status === 'Not Started',
                      'bg-red-100 text-red-800': goal.status === 'Abandoned'
                    }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {{ goal.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-32 bg-gray-200 rounded-full h-2.5 me-2">
                        <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${goal.progress}%` }"></div>
                      </div>
                      <span class="text-sm font-medium text-gray-900">{{ goal.progress }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Feedback -->
        <div v-if="activeTab === 'feedback'" class="bg-white rounded-lg shadow overflow-hidden">
          <div class="divide-y divide-gray-200">
            <div v-for="(feedback, index) in feedbacks" :key="index" class="p-6">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                </div>
                <div class="ms-4 flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900">
                      {{ feedback.reviewer_name }}
                      <span class="text-gray-500 font-normal">({{ feedback.reviewer_position }})</span>
                    </h3>
                    <span class="text-xs text-gray-500">{{ formatDate(feedback.created_at) }}</span>
                  </div>
                  <div class="mt-2 text-sm text-gray-700">
                    <p>{{ feedback.comment }}</p>
                  </div>
                  <div class="mt-3 flex items-center">
                    <span :class="{
                      'bg-green-100 text-green-800': feedback.sentiment === 'positive',
                      'bg-yellow-100 text-yellow-800': feedback.sentiment === 'neutral',
                      'bg-red-100 text-red-800': feedback.sentiment === 'negative'
                    }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full me-3">
                      {{ feedback.sentiment }}
                    </span>
                    <span :class="{
                      'bg-blue-100 text-blue-800': feedback.visibility === 'public',
                      'bg-gray-100 text-gray-800': feedback.visibility === 'private'
                    }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {{ feedback.visibility }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Tab } from '@/types/tabs'

const { t } = useI18n()
const route = useRoute()
const employeeStore = useEmployeesStore()
const performanceStore = useEmployeesPerformanceStore()
const { formatDate } = useDateFormat();

const employeeId = computed(() => route.params.employeeId as string)

const currentReview = computed(() =>
  performanceStore.performanceReviews.find(r => r.id === employeeId.value)
);

const actualEmployeeId = computed(() => currentReview.value?.employee_id || '');

// Now find the employee using the actual ID
const employee = computed(() =>
  employeeStore.employees.find(e =>
    e.id === actualEmployeeId.value ||
    e.employeeId === actualEmployeeId.value
  )
);

const activeTab = ref('reviews')

// Tabs configuration
type PerformanceTabId = 'reviews' | 'kpi' | 'goals' | 'feedback'
const tabs = ref<Tab<PerformanceTabId>[]>([
  { id: 'reviews', label: t('dashboard.performance_reviews') },
  { id: 'kpi', label: t('dashboard.kpi_tracker') },
  { id: 'goals', label: t('dashboard.goals') },
  { id: 'feedback', label: t('dashboard.recent_feedback') },
])

// Performance data
const performanceReviews = computed(() =>
  performanceStore.performanceReviews.filter(r => r.employee_id === employeeId.value)
)

const kpis = computed(() =>
  performanceStore.kpis.filter(k => k.employee_id === employeeId.value)
)

const goals = computed(() =>
  performanceStore.goals.filter(g => g.employee_id === employeeId.value)
)

const feedbacks = computed(() =>
  performanceStore.feedback.filter(f => f.employee_id === employeeId.value)
)

// Fetch data on mount
onMounted(async () => {
  if (!employeeStore.employees.length) {
    await employeeStore.fetchEmployees();
  }

  if (!performanceStore.performanceReviews.length) {
    await performanceStore.fetchPerformanceReviews();
  }
});

const employeeFullName = computed(() => {
  if (!employee.value) return '';
  return `${employee.value.firstName || ''} ${employee.value.lastName || ''}`.trim();
});

useHead({
  titleTemplate: () => t('head.admin_performance_reviews_employeeid'),
})
</script>