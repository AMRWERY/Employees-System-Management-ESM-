<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <p class="text-2xl font-semibold text-gray-700">{{ t('dashboard.teams') }}</p>
      <div class="flex items-center justify-center gap-4 ms-auto">
        <!-- base-button component -->
        <base-button :default-icon="false" @click="showAddDialog = true">
          {{ t('btn.add_team') }}
        </base-button>

        <!-- add-edit-team component -->
        <add-edit-team v-model="showAddDialog" :teamData="editingTeam || undefined" @save="handleSaveTeam" />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <!-- search-input component -->
      <search-input v-model="localSearchTerm" @search="handleGlobalSearch" :placeholder="t('form.search_by_name')"
        class="w-full sm:w-[300px]" :debounce="300" />

      <!-- refresh-data-btn component -->
      <refresh-data-btn @refresh="reloadData" :is-loading="refreshingData" />

      <!-- download-files-menu component -->
      <download-files-menu :allItems="teamStore.teams" :columns="tableColumns" fileNameBase="teams" />
    </div>

    <div v-if="loading || refreshingData" key="skeleton" class="mt-5">
      <table-skeleton-loader :headers="skeletonHeaders" :rows="3" />
    </div>

    <div class="mt-8" v-else>
      <div v-if="teamStore.paginatedTeams.length === 0" class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_teams_found')" icon="fluent:people-team-20-filled" />
      </div>

      <div v-else>
        <!-- dynamic-table component -->
        <dynamic-table :items="teamStore.paginatedTeams" :columns="tableColumns" :has-view="true" :has-edit="true"
          :has-delete="true" @view="viewTeam" @edit="openEditTeamDialog" @delete="openDeleteTeamDialog"
          v-model:selectedItems="selectedItems" @update:selectedItems="handleSelectedItemsUpdate" />
      </div>

      <!-- Delete Team Dialog -->
      <delete-dialog :show="dialogProps.show" :title="dialogProps.title" :message="dialogProps.message"
        :loading="dialogProps.loading" :cancelText="dialogProps.cancelText" :confirmText="dialogProps.confirmText"
        @close="dialogProps.onClose" @confirm="dialogProps.onConfirm" />

      <!-- Pagination component -->
      <pagination v-if="teamStore.totalTeamPages > 1" :current-page="teamStore.currentPage"
        :total-pages="teamStore.totalTeamPages" @page-change="handlePageChange" />
    </div>
  </div>
</template>

<script lang="ts" setup>;
import type { Teams } from '@/types/teams';
import type { TableHeader } from '@/types/table-header'
import type { DeleteDialogProps } from '@/types/delete-dialog'
import type { TableItem } from '@/types/tables';

const { t } = useI18n()
const teamStore = useTeamStore();
const { triggerToast } = useToast()
const { getTeamName } = useTeamName()

const dialogProps = ref<DeleteDialogProps>({
  show: false,
  title: '',
  message: '',
  cancelText: t('btn.cancel'),
  confirmText: t('btn.reject'),
  loading: false
})

const loading = ref(true);
const showAddDialog = ref(false);
const editingTeam = ref<Teams | null>(null);
const localSearchTerm = ref<string>(teamStore.searchTeamsByName || '');
const selectedItems = ref<TableItem[]>([]);
const refreshingData = ref(false); // For when the refresh button is clicked

const reloadData = async () => {
  if (refreshingData.value) return;
  refreshingData.value = true;
  try {
    await teamStore.fetchAll();
    triggerToast({
      message: t('toast.data_refreshed_successfully'),
      type: 'info',
      icon: 'mdi:check-circle-outline',
    });
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_reload_data'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    setTimeout(() => {
      refreshingData.value = false;
      loading.value = false;
    }, 500);
  }
};

const handleGlobalSearch = (newSearchTerm: string) => {
  teamStore.setTeamSearchTerm(newSearchTerm);
};

const openEditTeamDialog = (team: Teams) => {
  editingTeam.value = null;
  showAddDialog.value = false;
  setTimeout(() => {
    editingTeam.value = team;
    showAddDialog.value = true;
  }, 0);
}

const handleSaveTeam = async () => {
  showAddDialog.value = false;
  setTimeout(() => {
    editingTeam.value = null;
  }, 0);
};

const tableColumns = computed(() => {
  const { t } = useI18n();
  const { getTeamName } = useTeamName();
  return [
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
  ];
});

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-8' },
  { type: 'text', loaderWidth: 'w-48' },
  { type: 'action', loaderWidth: 'w-48' },
])

const viewTeam = (team: Teams) => {
  const router = useRouter();
  router.push(`/admin/teams/${team.departmentId}`);
}

const handleSelectedItemsUpdate = (items: TableItem[]) => {
  selectedItems.value = items;
}

onMounted(async () => {
  refreshingData.value = false;
  loading.value = true
  try {
    localSearchTerm.value = teamStore.searchTeamsByName || '';
    await teamStore.fetchAll()
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_load_teams'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    loading.value = false;
  }
});

const teamToDelete = ref<Teams | null>(null);

const openDeleteTeamDialog = (team: Teams) => {
  const name = getTeamName(team.id)
  teamToDelete.value = team
  dialogProps.value = {
    show: true,
    title: t('dashboard.delete_team_title'),
    message:
      t('dashboard.delete_team_confirmation_01', { name }) +
      ' ' +
      t('dashboard.delete_team_confirmation_02'),
    cancelText: t('btn.cancel'),
    confirmText: t('btn.delete'),
    loading: false,
    onClose: () => {
      dialogProps.value.show = false
      teamToDelete.value = null
    },
    onConfirm: async () => {
      dialogProps.value.loading = true
      try {
        if (!teamToDelete.value) return
        await teamStore.deleteTeam(teamToDelete.value.id)
        triggerToast({
          message: t('toast.team_deleted_success'),
          type: 'success',
          icon: 'mdi:check-circle-outline',
        })
        dialogProps.value.show = false
      } catch (error) {
        triggerToast({
          message: t('toast.failed_to_delete_team'),
          type: 'error',
          icon: 'material-symbols:error-outline-rounded',
        })
      } finally {
        dialogProps.value.loading = false
        teamToDelete.value = null
      }
    }
  }
}

const handlePageChange = (newPage: number) => {
  teamStore.setTeamCurrentPage(newPage);
}

useHead({
  titleTemplate: () => t('head.teams'),
})
</script>