<template>
  <div>
    <div class="relative" ref="container">
      <!-- Input Field -->
      <input type="text" v-model="query" @input="handleInput" @focus="handleFocus" @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev" @keydown.enter.prevent="selectHighlighted"
        class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow"
        :placeholder="placeholderText" aria-haspopup="listbox" :aria-expanded="isOpen" :disabled="isLoading" />
      <div v-if="isLoading" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <!-- You can use a spinner icon here -->
        <span class="text-xs text-gray-500">Loading...</span>
      </div>

      <!-- Suggestions List -->
      <ul v-if="hasFetched && filteredSuggestions.length > 0 && isOpen"
        class="absolute z-10 w-full mt-1 overflow-auto bg-white rounded-lg shadow-lg max-h-60" role="listbox">
        <li v-for="(suggestion, index) in filteredSuggestions" :key="suggestion.id" @click="selectItem(suggestion)"
          @mouseenter="highlightedIndex = index" :class="[
            'px-4 py-2 cursor-pointer transition-colors',
            highlightedIndex === index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
          ]" role="option" :aria-selected="highlightedIndex === index">
          {{ suggestion.display }}
          <span v-if="suggestion.name" class="ms-2 text-xs text-gray-500">({{ suggestion.name }})</span>
        </li>
      </ul>

      <!-- No Results Message -->
      <div v-if="isOpen && !filteredSuggestions.length && !isLoading"
        class="absolute w-full px-4 py-2 mt-1 text-gray-500 bg-white rounded-lg shadow-lg">
        <div v-if="isLoading" class="absolute inset-y-0 end-0 flex items-center pe-3">
          <icon name="svg-spinners:90-ring-with-bg" />
        </div>
        {{ t('dashboard.no_results_found_for') }} "{{ query }}"
      </div>
      <div v-if="isOpen && !filteredSuggestions.length && !isLoading && !query && hasFetched"
        class="absolute w-full px-4 py-2 mt-1 text-gray-500 bg-white rounded-lg shadow-lg">
        <div v-if="isLoading" class="absolute inset-y-0 end-0 flex items-center pe-3">
          <icon name="svg-spinners:90-ring-with-bg" />
        </div>
        {{ t('dashboard.no_employee_id_available') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Employee } from '@/types/employee';
import type { SuggestionItem } from '@/types/auto-complete-input';

const { t } = useI18n()

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits(['update:modelValue', 'itemSelected']);

const employeesStore = useEmployeesStore();

const query = ref<string>(props.modelValue || '');
const isOpen = ref<boolean>(false);
const highlightedIndex = ref<number>(-1);
const container = ref<HTMLElement | null>(null);
const isLoading = ref<boolean>(false);
const hasFetched = ref<boolean>(false);

const placeholderText = computed(() => props.placeholder || 'Search Employee ID...');

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== query.value) {
    query.value = newValue;
  }
});

const allEmployeeIdSuggestions = computed<SuggestionItem[]>(() => {
  // console.log('recalculating employee id')
  return employeesStore.employees
    .filter((emp): emp is Employee & { id: string; employeeId: string; uid: string } => {
      const hasValidId = typeof (emp.id || emp.uid) === 'string' && (emp.id || emp.uid) !== '';
      const hasValidEmployeeId = typeof emp.employeeId === 'string' && emp.employeeId !== '';
      return hasValidId && hasValidEmployeeId;
    })
    .map(emp => {
      const displayId = emp.id || emp.uid;
      const employeeValue = emp.employeeId;

      return {
        id: displayId,
        value: employeeValue,
        display: employeeValue,
      };
    });
});

const filteredSuggestions = computed<SuggestionItem[]>(() => {
  if (!query.value && !isOpen.value) return [];
  if (!query.value && isOpen.value) return allEmployeeIdSuggestions.value.slice(0, 10);
  const lowerQuery = query.value.toLowerCase();
  return allEmployeeIdSuggestions.value.filter(item =>
    item.value.toLowerCase().includes(lowerQuery) ||
    (item.name && item.name.toLowerCase().includes(lowerQuery))
  );
});

const fetchEmployeeIds = async () => {
  // console.log('fetching employee id list')
  isLoading.value = true;
  try {
    await employeesStore.fetchEmployees();
    hasFetched.value = true;
  } catch (error) {
    console.error("Failed to fetch employee IDs:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleInput = (): void => {
  isOpen.value = true;
  highlightedIndex.value = -1;
  emit('update:modelValue', query.value);
};

const handleFocus = async (): Promise<void> => {
  if (!hasFetched.value) {
    await fetchEmployeeIds();
  }
  isOpen.value = true;
};

const selectItem = (item: SuggestionItem): void => {
  query.value = item.value;
  isOpen.value = false;
  highlightedIndex.value = -1;
  emit('update:modelValue', item.value); // Emit selected employeeId
  emit('itemSelected', employeesStore.employees.find(e => e.employeeId === item.value));
};

const highlightNext = (): void => {
  if (!filteredSuggestions.value.length) return;
  highlightedIndex.value = (highlightedIndex.value + 1) % filteredSuggestions.value.length;
};

const highlightPrev = (): void => {
  if (!filteredSuggestions.value.length) return;
  highlightedIndex.value = (highlightedIndex.value - 1 + filteredSuggestions.value.length) % filteredSuggestions.value.length;
};

const selectHighlighted = (): void => {
  if (highlightedIndex.value >= 0 && filteredSuggestions.value[highlightedIndex.value]) {
    selectItem(filteredSuggestions.value[highlightedIndex.value]);
  } else if (filteredSuggestions.value.length === 1 && query.value) {
    selectItem(filteredSuggestions.value[0]);
  }
};

const clickOutsideHandler = (event: MouseEvent): void => {
  if (container.value && !container.value.contains(event.target as Node)) {
    isOpen.value = false;
    highlightedIndex.value = -1;
  }
};

onMounted(() => {
  fetchEmployeeIds();
  document.addEventListener('click', clickOutsideHandler);
});

onUnmounted(() => {
  document.removeEventListener('click', clickOutsideHandler);
});
</script>