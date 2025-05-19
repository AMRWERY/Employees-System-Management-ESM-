<template>
  <div>
    <!-- breadcrumb component -->
    <breadcrumb />

    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.teams') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
        <!-- base-button component -->
        <base-button :default-icon="false" @click="showAddDialog = true">
          {{ t('btn.add_team') }}
        </base-button>

        <!-- add-team component -->
        <add-team v-model="showAddDialog" @save="refreshTeamList" />
      </div>
    </div>

    <div v-if="loading" key="skeleton">
      <table-skeleton-loader :headers="skeletonHeaders" :rows="5" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="paginatedTeams.length === 0" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_teams_found')" icon="fluent:people-team-20-filled" />
      </div>

      <dynamic-table v-else :items="paginatedTeams" :columns="tableColumns" :has-view="true" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Teams } from '@/types/teams'
import type { TableHeader } from '@/components/shared/table-skeleton-loader.vue'
import type { Column } from '@/components/shared/dynamic-table.vue'

const { t } = useI18n()
const { triggerToast } = useToast()
const teamsStore = useTeamStore()
const {
  paginatedTeams,
  // currentPage,
  // totalPages
} = storeToRefs(teamsStore)

const formatDate = (date: Date | null) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
};

const tableColumns = computed(() => {
  const columns: Column<Teams>[] = [
    {
      key: 'index',
      label: '#',
      format: (row: Teams, index?: number) => String((index ?? 0) + 1)
    },
    {
      key: 'name',
      label: t('dashboard.name'),
    },
    {
      key: 'departmentId',
      label: t('dashboard.department_id'),
    },
    {
      key: 'leadId',
      label: t('dashboard.lead_id'),
    },
  ];
  return columns;
})

const loading = ref(true)

const showAddDialog = ref(false);

const refreshTeamList = async () => {
  try {
    loading.value = true;
    await teamsStore.fetchAll();
    teamsStore.updatePagination();
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await refreshTeamList()
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_load_teams'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    })
  } finally {
    loading.value = false
  }
})

// Add skeleton headers configuration
const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-8' },
  { type: 'text', loaderWidth: 'w-48' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'text', loaderWidth: 'w-32' },
  { type: 'action', loaderWidth: 'w-48' },
])

useHead({
  titleTemplate: () => t('head.teams'),
});
</script>