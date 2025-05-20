<template>
  <div>
    <div class="max-w-3xl mx-auto p-4 border border-gray-200 rounded-lg shadow">
      <div class="flex justify-center">
        <div class="relative w-36 h-36">
          <span class="sr-only">user photo</span>
          <img class="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow p-2"
            src="https://justfields.com/storage/projects/7M5rV059/images.jpg" alt="user-photo">
        </div>
      </div>

      <div v-if="employee">
        <div class="p-2 text-center">
          <h1 class="text-2xl font-bold capitalize text-gray-800">
            {{ employee.firstName }} {{ employee.lastName }}
          </h1>
          <p class="text-gray-700 mt-1 font-semibold text-lg">{{ employee.position }}</p>
        </div>

        <div class="space-y-6 mt-7 border-t pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Employee ID</p>
              <p class="text-gray-900 font-medium">{{ employee.employeeId }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">Department</p>
              <p class="text-gray-900 font-medium">{{ departmentName }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="text-gray-900 font-medium">{{ employee.email }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">Role</p>
              <p class="text-gray-900 font-medium capitalize">{{ employee.role }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Manager</p>
              <p class="text-gray-900 font-medium">manager name will display here :D</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">Average Performance</p>
              <p class="text-gray-900 font-medium">average performance will display here :D</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">left leave days</p>
              <p class="text-gray-900 font-medium">left leave days will display here :D</p>
            </div>

            <!-- <div>
              <p class="text-sm text-gray-500">Average Performance</p>
              <p class="text-gray-900 font-medium">average performance will display here :D</p>
            </div> -->
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Start Date</p>
              <p class="text-gray-900 font-medium">
                {{ formatDate(employee.createdAt) }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <p class="text-sm text-gray-500">Status</p>
              <span :class="employee.isBlocked
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'" class="px-3 py-1 rounded-full text-sm font-medium">
                {{ employee.isBlocked ? 'Blocked' : 'Active' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Member } from '@/types/teams'

const route = useRoute();
const teamsStore = useTeamStore();
const { formatDate } = useDateFormat();
const employee = ref<Member | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    if (teamsStore.teams.length === 0) {
      teamsStore.fetchAll();
    }
    const employeeId = route.params.employeeId as string;
    const result = await teamsStore.fetchEmployeeById(employeeId);
    if (result) {
      employee.value = result;
    } else {
      employee.value = null;
    }
  } catch (error) {
    console.error('Error:', error);
    employee.value = null;
  } finally {
    loading.value = false;
  }
});

const departmentName = computed(() => {
  if (!employee.value) return '';
  return teamsStore.getDepartmentName(employee.value.departmentId);
});
</script>