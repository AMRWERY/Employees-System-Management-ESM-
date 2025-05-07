<template>
  <div>
    <div class="space-y-3">
      <li v-if="hasAnyRole('manager')">
        <nuxt-link-locale to="/" class="flex items-center p-2 text-white rounded-lg group"
          exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
          <icon name="material-symbols:dashboard" class="w-5 h-5 transition duration-75 group-hover:text-white"
            :class="{ 'text-gray-400': $route.path === '/', 'text-white': $route.path !== '/' }" aria-hidden="true" />
          <span class="flex-1 ms-3 whitespace-nowrap">{{ $t('layouts.dashboard') }}</span>
        </nuxt-link-locale>
      </li>

      <li v-if="hasAnyRole('manager')">
        <button @click="toggleDropdown('team')" type="button"
          class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
          <icon name="game-icons:team-idea"
            class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
            aria-hidden="true" />
          <span class="flex-1 ms-3 text-start whitespace-nowrap">{{ $t('layouts.team_management') }}</span>
          <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
            :class="{ 'rotate-180': openDropdowns.team }" aria-hidden="true" />
        </button>
        <ul v-if="openDropdowns.team" class="py-2 space-y-2">
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-14"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ $t('layouts.team_members') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-14"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ $t('layouts.attendance_records') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-14"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ $t('layouts.leave_requests') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg group ps-14"
              exact-active-class="bg-gray-400 text-white hover:bg-gray-500">
              {{ $t('layouts.performance_reviews') }}
            </nuxt-link>
          </li>
        </ul>
      </li>
    </div>
  </div>
</template>

<script lang="ts" setup>
type DropdownNames = 'team'

// Track which dropdowns are open
const openDropdowns = reactive<Record<DropdownNames, boolean>>({
  team: true, // Open by default
})

const toggleDropdown = (name: DropdownNames) => {
  openDropdowns[name] = !openDropdowns[name]
}

const { hasAnyRole } = useUserRoles()
</script>