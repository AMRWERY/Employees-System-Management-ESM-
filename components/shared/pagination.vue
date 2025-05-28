<template>
  <div>
    <ul class="flex border-2 border-gray-200 divide-s-2 divide-gray-200 rounded-lg overflow-hidden w-max my-9 ms-auto">
      <li
        class="flex items-center justify-center shrink-0 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-slate-900 font-semibold"
        :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }" @click="changePage(currentPage - 1)">
        {{ t('pagination.previous') }}
      </li>

      <template v-for="page in visiblePages" :key="page">
        <li v-if="page === '...'"
          class="flex items-center justify-center shrink-0 px-4 py-2 hover:bg-gray-50 cursor-pointer text-base font-semibold text-gray-500">
          ...
        </li>
        
        <li v-else
          class="flex items-center justify-center shrink-0 px-4 py-2 hover:bg-gray-50 cursor-pointer text-base font-semibold"
          :class="{
            '!bg-gray-100 text-slate-900': page === currentPage,
            'text-gray-500': page !== currentPage
          }" @click="changePage(page as number)">
          {{ page }}
        </li>
      </template>

      <li
        class="flex items-center justify-center shrink-0 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-slate-900 font-semibold"
        :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }" @click="changePage(currentPage + 1)">
        {{ t('pagination.next') }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  maxVisiblePages: {
    type: Number,
    default: 4
  }
});

const emit = defineEmits(['page-change']);

const { t } = useI18n();

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const half = Math.floor(props.maxVisiblePages / 2);
  let start = Math.max(props.currentPage - half, 1);
  let end = Math.min(start + props.maxVisiblePages - 1, props.totalPages);
  if (end - start < props.maxVisiblePages - 1) {
    start = Math.max(end - props.maxVisiblePages + 1, 1);
  }
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < props.totalPages - 1) pages.push('...');
  if (end < props.totalPages) pages.push(props.totalPages);
  return pages;
});

const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= props.totalPages && newPage !== props.currentPage) {
    emit('page-change', newPage);
  }
};
</script>