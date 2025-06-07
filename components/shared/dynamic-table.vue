<template>
  <div>
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table class="w-full text-sm text-start text-gray-500">
        <thead class="text-sm text-gray-700 bg-gray-100">
          <tr>
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
                <button v-if="hasDelete" class="cursor-pointer" title="Delete" @click="$emit('delete', item)">
                  <icon name="material-symbols:delete-sharp" class="w-6 h-6 text-red-500 hover:text-red-700" />
                </button>
                <button v-if="hasEdit" class="cursor-pointer" title="Edit" @click="$emit('edit', item)">
                  <icon name="heroicons-outline:pencil-alt"
                    class="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 hover:text-indigo-800" />
                </button>

                <!-- Mark Paid Action (NEW for Payroll) -->
                <button v-if="hasMarkPaid" class="cursor-pointer" title="Mark Paid" @click="$emit('markPaid', item)">
                  <icon name="heroicons-outline:check-circle"
                    class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 hover:text-green-800" />
                </button>

                <!-- Mark Failed Action (NEW for Payroll) -->
                <button v-if="hasMarkFailed" class="cursor-pointer" title="Mark Failed"
                  @click="$emit('markFailed', item)">
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
// type StatusType = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'blocked' | 'active';

const props = defineProps<{
  items: readonly any[];
  columns: Column[];
  hasView?: boolean;
  hasDelete?: boolean;
  hasBlock?: boolean;
  hasEdit?: boolean;
  hasMarkPaid?: boolean;
  hasMarkFailed?: boolean;
}>()

defineEmits<{
  <T = any>(event: 'view', item: T): void;
  <T = any>(event: 'delete', item: T): void;
  <T = any>(event: 'block', item: T): void;
  <T = any>(event: 'edit', item: T): void;
  <T = any>(event: 'markPaid', item: T): void;
  <T = any>(event: 'markFailed', item: T): void;
}>()

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