<template>
  <div>
    <div class="space-y-3">
      <li v-if="hasAnyRole('accountant')">
        <nuxt-link-locale to="/" class="flex items-center p-2 text-white rounded-lg group"
          exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
          <icon name="material-symbols:dashboard" class="w-5 h-5 transition duration-75 group-hover:text-white"
            :class="{ 'text-gray-400': route.path === '/', 'text-white': route.path !== '/' }" aria-hidden="true" />
          <span class="flex-1 ms-3 whitespace-nowrap">{{ t('layouts.dashboard') }}</span>
        </nuxt-link-locale>
      </li>

      <li v-if="hasAnyRole('accountant')">
        <button @click="toggleDropdown('payroll')" type="button"
          class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
          <icon name="eos-icons:cluster-management"
            class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
            aria-hidden="true" />
          <span class="flex-1 ms-3 text-start whitespace-nowrap">{{ t('layouts.payrolls') }}</span>
          <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
            :class="{ 'rotate-180': openDropdowns.payroll }" aria-hidden="true" />
        </button>
        <ul v-if="openDropdowns.payroll" class="py-2 space-y-2">
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.payroll_management') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.compensations') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.reports') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.payment_logs') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.attendance_leave_review') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.performance_reviews') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.leave_management') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-7"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ t('layouts.attendance') }}
            </nuxt-link>
          </li>
        </ul>
      </li>

      <li v-if="hasAnyRole('accountant')">
        <nuxt-link-locale to="/holiday-dates" class="flex items-center p-2 text-white rounded-lg group"
          :class="isActive('/holiday-dates') ? 'bg-gray-400 text-white hover:bg-gray-500' : ''">
          <icon name="heroicons-solid:calendar-days" class="w-5 h-5 transition duration-75 group-hover:text-white"
            :class="{ 'text-gray-400': route.path === '/holiday-dates', 'text-white': route.path !== '/holiday-dates' }" />
          <span class="flex-1 ms-3 whitespace-nowrap">{{ t('layouts.holiday_dates') }}</span>
        </nuxt-link-locale>
      </li>

      <li v-if="hasAnyRole('accountant')">
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
const isActive = useSidebarActive()
const { hasAnyRole } = useUserRoles()

type DropdownNames = 'payroll'

// Track which dropdowns are open
const openDropdowns = reactive<Record<DropdownNames, boolean>>({
  payroll: true, // Open by default
})

const toggleDropdown = (name: DropdownNames) => {
  openDropdowns[name] = !openDropdowns[name]
}
</script>

<style scoped>
[dir="rtl"] .router-link-active {
  background-color: rgb(156 163 175) !important;
}

/* Ensure active state works in both directions */
.router-link-active {
  background-color: rgb(156 163 175);
  color: white !important;
}

.router-link-active:hover {
  background-color: rgb(107 114 128);
}
</style>