<template>
  <div>
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table class="w-full text-sm text-start text-gray-500 whitespace-nowrap">
        <thead class="text-sm text-gray-700 bg-gray-100">
          <tr>
            <th scope="col" class="p-4">
              <div class="flex items-center">
                <input id="checkbox-all-search" type="checkbox"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  :checked="areAllPageItemsSelectableAndSelected" :indeterminate="isHeaderCheckboxIndeterminate"
                  @change="toggleSelectAllOnPage" />
                <label for="checkbox-all-search" class="sr-only">checkbox</label>
              </div>
            </th>
            <th v-for="(column, index) in columns" :key="index" scope="col" class="px-6 py-3">
              {{ column.label }}
            </th>
            <th scope="col" class="px-6 py-3" v-if="hasView || hasDelete || hasBlock">
              <span class="sr-only">actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="index" class="bg-white border-b border-gray-200 hover:bg-gray-50">
            <td class="w-4 p-4">
              <div class="flex items-center">
                <input v-if="item.id !== undefined" :id="'checkbox-table-search-' + item.id" type="checkbox"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" :checked="isItemSelected(item)"
                  @change="() => toggleSelectItem(item)" />
                <label v-if="item.id !== undefined" :for="'checkbox-table-search-' + item.id"
                  class="sr-only">checkbox</label>
              </div>
            </td>
            <td v-for="(column, colIndex) in columns" :key="colIndex" class="px-6 py-4">
              <template v-if="column.key === 'status'">
                <span v-if="item.status"
                  :class="['px-2.5 py-1 rounded-full text-sm font-medium', getStatusClass(item.status)]">
                  <template v-if="column.format">
                    {{ column.format(item) }}
                  </template>
                  <template v-else>
                    {{ item.status }}
                  </template>
                </span>
                <template v-else>
                  <template v-if="column.format">
                    {{ column.format(item) }}
                  </template>
                  <template v-else>
                    {{ getValue(item, column.key) }}
                  </template>
                </template>
              </template>

              <template v-else-if="column.format && column.key !== 'dates'">
                {{ column.format(item, index) }}
              </template>
              <template v-else-if="column.format && column.key === 'dates'">
                <span v-html="column.format(item, index)"></span>
              </template>

              <template v-else>
                {{ getValue(item, column.key) }}
              </template>
            </td>

            <td v-if="hasView || hasBlock || hasDelete || hasEdit || hasMarkPaid || hasMarkFailed"
              class="px-6 py-4 text-end">
              <div class="flex items-center gap-3">
                <button v-if="hasView" class="cursor-pointer" title="View" @click="$emit('view', item)">
                  <icon name="tabler:eye" class="w-7 h-7 text-blue-500 hover:text-blue-700" />
                </button>
                <button v-if="hasBlock" class="cursor-pointer" title="Block" @click="$emit('block', item)">
                  <icon name="material-symbols:block" class="w-6 h-6"
                    :class="[item.status === 'blocked' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700']" />
                </button>
                <button v-if="hasDelete && actionConditions?.delete && actionConditions.delete(item)"
                  class="cursor-pointer" title="Delete" @click="$emit('delete', item)">
                  <icon name="material-symbols:delete-sharp" class="w-6 h-6 text-red-500 hover:text-red-700" />
                </button>
                <button v-if="hasEdit && actionConditions?.edit && actionConditions.edit(item)" class="cursor-pointer"
                  title="Edit" @click="$emit('edit', item)">
                  <icon name="heroicons-outline:pencil-alt"
                    class="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 hover:text-indigo-800" />
                </button>

                <!-- Mark Paid Action (NEW for Payroll) -->
                <button v-if="hasMarkPaid && actionConditions?.markPaid && actionConditions.markPaid(item)"
                  class="cursor-pointer" title="Mark Paid" @click="$emit('markPaid', item)">
                  <icon name="heroicons-outline:check-circle"
                    class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 hover:text-green-800" />
                </button>

                <!-- Mark Failed Action (NEW for Payroll) -->
                <button v-if="hasMarkFailed && actionConditions?.markFailed && actionConditions.markFailed(item)"
                  class="cursor-pointer" title="Mark Failed" @click="$emit('markFailed', item)">
                  <icon name="heroicons-outline:x-circle"
                    class="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 hover:text-yellow-700" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Column, TableItem } from '@/types/tables'

type StatusType = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'blocked' | 'active' | 'paid' | 'failed';

const props = defineProps<{
  items: readonly any[];
  columns: Column[];
  hasView?: boolean;
  hasDelete?: boolean;
  hasBlock?: boolean;
  hasEdit?: boolean;
  hasMarkPaid?: boolean;
  hasMarkFailed?: boolean;
  actionConditions?: {
    edit?: (item: any) => boolean;
    delete?: (item: any) => boolean;
    markPaid?: (item: any) => boolean;
    markFailed?: (item: any) => boolean;
  };
  selectedItems?: TableItem[];
}>()

const actionConditions = props.actionConditions || {
  edit: () => true,
  delete: () => true,
  markPaid: () => true,
  markFailed: () => true
};

const emit = defineEmits<{
  <T = any>(event: 'view', item: T): void;
  <T = any>(event: 'delete', item: T): void;
  <T = any>(event: 'block', item: T): void;
  <T = any>(event: 'edit', item: T): void;
  <T = any>(event: 'markPaid', item: T): void;
  (event: 'update:selectedItems', items: TableItem[]): void;
}>()

const localSelectedItems = computed({
  get: () => props.selectedItems || [],
  set: (newValue: TableItem[]) => {
    // console.log('Emitting update:selectedItems with:', newValue);
    emit('update:selectedItems', newValue);
  }
});

watch(() => props.selectedItems, (newSelection) => {
  return newSelection
  // console.log('Parent updated selectedItems:', newSelection);
}, { deep: true });

const isItemSelected = (item: TableItem): boolean => {
  if (item.id === undefined) {
    // console.warn('Item missing id:', item);
    return false;
  }
  return localSelectedItems.value.some(selected => selected.id === item.id);
};

const toggleSelectItem = (item: TableItem) => {
  if (item.id === undefined) return;
  const currentSelection = [...localSelectedItems.value];
  const index = currentSelection.findIndex(selected => selected.id === item.id);
  if (index > -1) {
    currentSelection.splice(index, 1);
    // console.log(`Deselected item ${item.id}`);
  } else {
    currentSelection.push(item);
    // console.log(`Selected item ${item.id}`);
  }
  localSelectedItems.value = currentSelection;
};

const areAllPageItemsSelectableAndSelected = computed(() => {
  if (!props.items || props.items.length === 0) return false;
  const selectablePageItems = props.items.filter(item => item.id !== undefined);
  if (selectablePageItems.length === 0) return false;
  return selectablePageItems.every(item => isItemSelected(item));
});

const isAnyPageItemSelected = computed(() => {
  if (!props.items || props.items.length === 0) return false;
  return props.items.some(item => item.id !== undefined && isItemSelected(item));
});

const isHeaderCheckboxIndeterminate = computed(() => {
  return isAnyPageItemSelected.value && !areAllPageItemsSelectableAndSelected.value;
});

const toggleSelectAllOnPage = (event: Event) => {
  const checkbox = event.target as HTMLInputElement;
  let currentFullSelection = [...localSelectedItems.value];
  const pageItemIds = new Set(props.items.map(i => i.id).filter(id => id !== undefined));
  if (checkbox.checked) {
    props.items.forEach(pageItem => {
      if (pageItem.id !== undefined && !currentFullSelection.some(selected => selected.id === pageItem.id)) {
        currentFullSelection.push(pageItem);
      }
    });
    // console.log('Selected all items on page:', currentFullSelection);
  } else {
    currentFullSelection = currentFullSelection.filter(selectedItem => !pageItemIds.has(selectedItem.id));
    // console.log('Deselected all items on page:', currentFullSelection);
  }
  localSelectedItems.value = currentFullSelection;
};

const statusClasses: Record<StatusType, string> = {
  pending: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
  approved: 'text-green-600 bg-green-100 hover:bg-green-200',
  rejected: 'text-red-600 bg-red-100 hover:bg-red-200',
  cancelled: 'text-gray-600 bg-gray-100 hover:bg-gray-200',
  blocked: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  paid: 'text-green-700 bg-green-200',
  failed: 'text-orange-700 bg-orange-200'
}

const getStatusClass = (status: string | undefined): string => {
  // console.log('status', status)
  if (!status) return '';
  return status in statusClasses ? statusClasses[status as StatusType] : '';
}

const getValue = (item: TableItem, key: string | number | symbol): any => {
  if (typeof key === 'string') {
    return item[key];
  }
  return '';
}

// const { hasPermission } = usePermissions()
</script>