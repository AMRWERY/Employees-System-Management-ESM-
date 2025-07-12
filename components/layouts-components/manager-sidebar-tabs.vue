<template>
  <div>
    <div class="space-y-3">
      <li v-if="hasAnyRole('manager')">
        <nuxt-link-locale to="/" class="flex items-center p-2 text-white rounded-lg group"
          exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
          <icon name="material-symbols:dashboard" class="w-5 h-5 transition duration-75 group-hover:text-white"
            :class="{ 'text-gray-400': route.path === '/', 'text-white': route.path !== '/' }" aria-hidden="true" />
          <span class="flex-1 ms-3 whitespace-nowrap">{{ t('layouts.dashboard') }}</span>
        </nuxt-link-locale>
      </li>

      <li v-if="hasAnyRole('manager')">
        <button @click="toggleDropdown('team')" type="button"
          class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group">
          <icon name="game-icons:team-idea" class="w-5 h-5 transition duration-75 group-hover:text-white"
            aria-hidden="true" />
          <span class="flex-1 ms-3 text-start whitespace-nowrap">{{ t('layouts.team_management') }}</span>
          <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
            :class="{ 'rotate-180': openDropdowns.team }" aria-hidden="true" />
        </button>
        <ul v-if="openDropdowns.team" class="py-2 space-y-2">
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.team_members') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.attendance_records') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.leave_requests') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.performance_reviews') }}
            </nuxt-link>
          </li>
        </ul>
      </li>

      <li v-if="hasAnyRole('manager')">
        <nuxt-link-locale to="/holiday-dates" class="flex items-center p-2 text-white rounded-lg group"
          :class="isActive('/holiday-dates') ? 'bg-gray-400 text-white hover:bg-gray-500' : ''">
          <icon name="heroicons-solid:calendar-days" class="w-5 h-5 transition duration-75 group-hover:text-white"
            :class="{ 'text-gray-400': route.path === '/holiday-dates', 'text-white': route.path !== '/holiday-dates' }" />
          <span class="flex-1 ms-3 whitespace-nowrap">{{ t('layouts.holiday_dates') }}</span>
        </nuxt-link-locale>
      </li>

      <li v-if="hasAnyRole('manager')">
        <nuxt-link-locale to="/task-management" class="flex items-center p-2 text-white rounded-lg group"
          :class="isActive('/task-management') ? 'bg-gray-400 text-white hover:bg-gray-500' : ''">
          <icon name="fluent:tasks-app-28-filled" class="w-5 h-5 transition duration-75 group-hover:text-white"
            :class="{ 'text-gray-400': route.path === '/task-management', 'text-white': route.path !== '/settings' }" />
          <span class="flex-1 ms-3 whitespace-nowrap">{{ t('layouts.task_management') }}</span>
        </nuxt-link-locale>
      </li>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const route = useRoute();
const { hasAnyRole } = useUserRoles()
const isActive = useSidebarActive()

type DropdownNames = 'team'

const dropdownStates = ref({
  team: true,
});

onMounted(() => {
  const savedStates = localStorage.getItem('sidebarDropdowns');
  if (savedStates) {
    try {
      const parsed = JSON.parse(savedStates);
      dropdownStates.value = {
        ...dropdownStates.value,
        ...parsed
      };
    } catch (e) {
      console.error('Error parsing dropdown states:', e);
    }
  }
});

const openDropdowns = computed(() => dropdownStates.value);

const toggleDropdown = (name: DropdownNames) => {
  dropdownStates.value[name] = !dropdownStates.value[name];
  localStorage.setItem('sidebarDropdowns', JSON.stringify(dropdownStates.value));
}
</script>