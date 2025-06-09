<template>
  <div>
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

    <div class="flex items-center gap-4">
      <!-- search-input component -->
      <search-input v-model="localSearchTerm" @search="handleGlobalSearch" :placeholder="t('form.search_by_name')"
        class="w-full sm:w-[300px]" :debounce="300" />

      <!-- download-files-menu component -->
      <download-files-menu :allItems="teamsStore.teams" :columns="tableColumns" fileNameBase="teams" />
    </div>

    <div v-if="loading" key="skeleton">
      <table-skeleton-loader :headers="skeletonHeaders" :rows="3" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="teamsStore.paginatedTeams.length === 0" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_teams_found')" icon="fluent:people-team-20-filled" />
      </div>

      <!-- dynamic-table component -->
      <div v-else>
        <dynamic-table :items="teamsStore.paginatedTeams" :columns="tableColumns" :has-view="true" @view="viewTeam" />
      </div>

      <!-- pagination component -->
      <pagination v-if="teamsStore.totalTeamPages > 1" :current-page="teamsStore.currentPage"
        :total-pages="teamsStore.totalTeamPages" @page-change="handlePageChange" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Teams } from '@/types/teams'
import type { TableHeader } from '@/types/table-header'
import type { Column } from '@/types/tables'

const { t } = useI18n()
const { triggerToast } = useToast()
const teamsStore = useTeamStore()
const localSearchTerm = ref<string>(teamsStore.searchTeamsByName || '');

const handleGlobalSearch = (newSearchTerm: string) => {
  teamsStore.setTeamSearchTerm(newSearchTerm);
};

const handlePageChange = (newPage: number) => {
  teamsStore.setTeamCurrentPage(newPage);
};

// useTeamNameTranslation composable
const { getTeamName } = useTeamName();

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
      format: (team: Teams) => getTeamName(team.id)
    },
    // {
    //   key: 'departmentId',
    //   label: t('dashboard.department_id'),
    // },
    // {
    //   key: 'leadId',
    //   label: t('dashboard.lead_id'),
    // },
  ];
  return columns;
})

const loading = ref(true)

const showAddDialog = ref(false);

const refreshTeamList = async () => {
  try {
    loading.value = true;
    await teamsStore.fetchAll();
    teamsStore.updateTeamPagination();
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    localSearchTerm.value = teamsStore.searchTeamsByName || '';
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

const router = useRouter();

const viewTeam = (team: Teams) => {
  router.push(`/admin/teams/${team.departmentId}`);
};

// Add skeleton headers configuration
const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-8' },
  { type: 'text', loaderWidth: 'w-48' },
  // { type: 'text', loaderWidth: 'w-32' },
  // { type: 'text', loaderWidth: 'w-32' },
  { type: 'action', loaderWidth: 'w-48' },
])

useHead({
  titleTemplate: () => t('head.teams'),
});
</script>