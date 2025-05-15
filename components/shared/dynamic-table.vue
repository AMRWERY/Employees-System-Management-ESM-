<template>
  <div>
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table class="w-full text-sm text-start text-gray-500">
        <thead class="text-sm text-gray-700 bg-gray-100">
          <tr>
            <th scope="col" class="px-6 py-3">#</th>
            <th scope="col" class="px-6 py-3">{{ t('dashboard.from_to') }}</th>
            <th scope="col" class="px-6 py-3">{{ t('dashboard.manager') }}</th>
            <th scope="col" class="px-6 py-3">{{ t('dashboard.request_type') }}</th>
            <th scope="col" class="px-6 py-3">{{ t('dashboard.status') }}</th>
            <th scope="col" class="px-6 py-3">
              <span class="sr-only">actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(request, index) in requests" :key="index"
            class="bg-white border-b border-gray-200 hover:bg-gray-50">
            <td class="px-6 py-4">{{ index + 1 }}</td>
            <td class="px-6 py-4">
              <p class="font-semibold">{{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}</p>
            </td>
            <td class="px-6 py-4">
              <p class="font-semibold">
                {{ request.manager }}
              </p>
            </td>
            <td class="px-6 py-4">
              <p class="font-semibold">{{ t(`form.${request.type}`) }}</p>
            </td>
            <td class="px-6 py-4">
              <span :class="statusClasses[request.status]"
                class="flex items-center text-sm px-3 py-1.5 tracking-wide rounded-full max-w-fit cursor-pointer">
                {{ t(`status.${request.status}`) }}
              </span>
            </td>
            <td class="px-6 py-4 text-end">
              <div class="flex items-center gap-2.5">
                <button class="cursor-pointer" title="View" @click="$emit('view', request)"
                  v-if="hasPermission('leave-management', 'view')">
                  <icon name="tabler:eye" class="w-7 h-7 text-blue-500 hover:text-blue-700" />
                </button>
                <button class="cursor-pointer" title="delete" @click="$emit('delete', request)"
                  v-if="hasPermission('leave-management', 'delete')">
                  <icon name="material-symbols:delete-sharp" class="w-6 h-6 text-red-500 hover:text-red-700" />
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
import type { LeaveRequest } from '@/types/leaveRequest'

const { t } = useI18n()

const props = defineProps<{
  requests: LeaveRequest[]
}>()

const statusClasses = {
  pending: 'text-red-600 bg-red-100 hover:bg-red-200',
  approved: 'text-green-600 bg-green-100 hover:bg-green-200',
  rejected: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
  cancelled: 'text-gray-600 bg-gray-100 hover:bg-gray-200'
}

defineEmits(['view', 'delete'])

const formatDate = (date: Date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }).format(date);
};

const { hasPermission } = usePermissions()
</script>