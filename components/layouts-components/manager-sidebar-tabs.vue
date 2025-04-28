<template>
  <div>
    <li>
      <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
        <icon name="material-symbols:dashboard"
          class="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" aria-hidden="true" />
        <span class="flex-1 ms-3 whitespace-nowrap">Dashboard</span>
      </nuxt-link>
    </li>

    <li>
      <button @click="toggleDropdown('team')" type="button"
        class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
        <icon name="game-icons:team-idea"
          class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
          aria-hidden="true" />
        <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Team Management</span>
        <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
          :class="{ 'rotate-180': openDropdowns.team }" aria-hidden="true" />
      </button>
      <ul v-if="openDropdowns.team" class="py-2 space-y-2">
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
            Team Members
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
            Attendance Records
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
            Leave Requests
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
            Performance Reviews
          </nuxt-link>
        </li>
      </ul>
    </li>
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
</script>