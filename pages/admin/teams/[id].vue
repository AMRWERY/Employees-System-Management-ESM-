<template>
  <div>
    <div class="flex items-center justify-between my-6 flex-nowrap">
      <h2 class="text-2xl font-semibold">{{ t('dashboard.employees') }}</h2>
      <!-- <div class="flex items-center justify-center gap-4 ms-auto">
        <base-button :default-icon="false" @click="showAddDialog = true">
          {{ t('btn.add_employee') }}
        </base-button>
        <add-employee v-model="showAddDialog" @save="handleSave" />
      </div> -->
    </div>

    <div class="relative w-[300px] mb-4">
      <input type="text" v-model="searchTerm" :placeholder="t('form.search_by_email')"
        class="px-4 py-2 pe-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
      <div class="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
        <icon name="heroicons-solid:magnifying-glass" class="w-5 h-5 text-gray-400" />
      </div>
    </div>

    <div v-if="loading" key="skeleton">
      <!-- table-skeleton-loader component -->
      <table-skeleton-loader :headers="skeletonHeaders" :rows="5" />
    </div>

    <div v-else>
      <template v-if="teamsStore.paginatedMembers.length > 0">
        <!-- dynamic-table component -->
        <dynamic-table :items="teamsStore.paginatedMembers" :columns="tableColumns" :has-view="true"
          @view="viewEmployeeDetails" />

        <!-- pagination component -->
        <pagination v-if="teamsStore.totalMemberPages > 1" :current-page="teamsStore.currentMemberPage"
          :total-pages="teamsStore.totalMemberPages" @page-change="handlePageChange" />
      </template>

      <div v-else class="text-center">
        <!-- no-data-message component -->
        <no-data-message :message="t('no_data.no_employees_found')" icon="clarity:employee-group-solid" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TableHeader } from '@/types/table-header'
import type { Member } from '@/types/teams'
import type { Column } from '@/types/tables'

const { t } = useI18n()
const route = useRoute()
const router = useRouter();
const teamsStore = useTeamStore();
const managersStore = useManagerStore()
// const { triggerToast } = useToast()
const searchTerm = ref('');

const departmentId = computed(() =>
  Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id
);

watch(departmentId, (newId) => {
  if (newId) {
    teamsStore.fetchUsersByDepartment(newId);
  }
}, { immediate: true });

watch(searchTerm, (term) => {
  teamsStore.setMemberSearchTerm(term);
});

const handlePageChange = (newPage: number) => {
  teamsStore.setMemberCurrentPage(newPage);
};

onMounted(() => {
  teamsStore.fetchUsersByDepartment(departmentId.value);
  managersStore.fetchManagers();
});

const loading = computed(() => teamsStore.loading);

onUnmounted(() => {
  teamsStore.unsubscribeListeners.forEach(unsub => unsub());
  teamsStore.unsubscribeListeners = [];
});

// Add state for delete dialog
// const dialogProps = ref<DeleteDialogProps>({
//   show: false,
//   title: '',
//   message: '',
//   cancelText: t('btn.cancel'),
//   confirmText: t('btn.reject'),
//   loading: false
// })

// const selectedEmployee = ref<Employee | null>(null)

const tableColumns = computed(() => {
  const columns: Column<Member>[] = [
    {
      key: 'index',
      label: '#',
      format: (row: Member, index?: number) => String((index ?? 0) + 1)
    },
    { key: 'employeeId', label: t('dashboard.employee_id') },
    {
      key: 'name',
      label: t('form.employee_name'),
      format: (employee: Member) => `${employee.firstName} ${employee.lastName}`
    },
    { key: 'email', label: t('form.email') },
    { key: 'position', label: t('dashboard.position') },
    {
      key: 'managerId',
      label: t('dashboard.manager'),
      format: (employee: Member) => {
        if (!employee.managerId) return t("dashboard.not_assigned");
        const manager = managersStore.managers.find(m => m.id === employee.managerId);
        return manager ? `${manager.firstName} ${manager.lastName}` : t("dashboard.not_assigned");
      }
    },
    {
      key: 'status',
      label: t('form.status'),
      format: (employee: Member) => {
        const status = employee.status === 'blocked';
        employee.status = status ? 'blocked' : 'active';
        return status ? t('status.blocked') : t('status.active');
      }
    }
  ];
  return columns;
})

const skeletonHeaders = ref<TableHeader[]>([
  { type: 'text', loaderWidth: 'w-32' }, // Index
  { type: 'text', loaderWidth: 'w-32' }, // Employee ID
  { type: 'text', loaderWidth: 'w-48' }, // Name
  { type: 'text', loaderWidth: 'w-48' }, // Email
  { type: 'text', loaderWidth: 'w-48' }, // Manager
  { type: 'text', loaderWidth: 'w-32' }, // Status
  { type: 'action', loaderWidth: 'w-32' }, // Actions
])

const viewEmployeeDetails = (member: Member) => {
  router.push(`/admin/teams/employees/${member.id}`);
};

// const viewEmployee = (employee: Member) => {
//   // Implement view functionality
//   console.log('View employee:', employee)
// }

// const toggleBlockEmployee = async (employee: Employee) => {
//   try {
//     await employeesStore.toggleBlockEmployee(employee.id)
//     triggerToast({
//       message: employee.isBlocked
//         ? t('toast.employee_unblocked')
//         : t('toast.employee_blocked'),
//       type: 'success',
//       icon: 'mdi-check-circle',
//     })
//   } catch (error) {
//     console.error('Error blocking employee:', error)
//     triggerToast({
//       message: t('toast.failed_to_toggle_block'),
//       type: 'error',
//       icon: 'material-symbols:error-outline-rounded',
//     })
//   }
// }

// const deleteEmployee = async (employee: Employee) => {
//   selectedEmployee.value = employee
//   const name = employee.firstName + ' ' + employee.lastName
//   dialogProps.value = {
//     show: true,
//     title: t('dashboard.delete_employee_title'),
//     message: t('dashboard.delete_employee_confirmation_01', { name: name }) + '' + t('dashboard.delete_employee_confirmation_02'),
//     cancelText: t('btn.cancel'),
//     confirmText: t('btn.reject'),
//     loading: false,
//     onClose: () => {
//       dialogProps.value.show = false
//       selectedEmployee.value = null
//     },
//     onConfirm: async () => {
//       dialogProps.value.loading = true
//       try {
//         await employeesStore.deleteEmployees(employee.id)
//         dialogProps.value.show = false
//         selectedEmployee.value = null
//         triggerToast({
//           message: t('toast.employee_deleted'),
//           type: 'success',
//           icon: 'mdi-check-circle',
//         })
//       } catch (error) {
//         triggerToast({
//           message: t('toast.failed_to_delete_employee'),
//           type: 'error',
//           icon: 'material-symbols:error-outline-rounded',
//         })
//       } finally {
//         dialogProps.value.loading = false
//       }
//     }
//   }
// }

// const showAddDialog = ref(false);

// const handleSave = async () => {
//   try {
//     // Your save logic
//     showAddDialog.value = false;
//     // triggerToast({...});
//   } catch (error) {
//     // Error handling
//   }
// };

useHead({
  titleTemplate: () => t('head.admin_teams_id'),
})
</script>