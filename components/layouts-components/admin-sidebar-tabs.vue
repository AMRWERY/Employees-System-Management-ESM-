<template>
  <div>
    <li>
      <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
        <icon name="material-symbols:dashboard"
          class="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" aria-hidden="true" />
        <span class="flex-1 ms-3 whitespace-nowrap">{{ $t('layouts.dashboard') }}</span>
      </nuxt-link>
    </li>

    <li>
      <button @click="toggleDropdown('management')" type="button"
        class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
        <icon name="eos-icons:cluster-management"
          class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
          aria-hidden="true" />
        <span class="flex-1 ms-3 text-start whitespace-nowrap">{{ $t('layouts.management') }}</span>
        <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
          :class="{ 'rotate-180': openDropdowns.management }" aria-hidden="true" />
      </button>
      <ul v-if="openDropdowns.management" class="py-2 space-y-2">
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg ps-11 group hover:bg-gray-800">
            Employees
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg ps-11 group hover:bg-gray-800">
            Teams
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg ps-11 group hover:bg-gray-800">
            Roles & Permissions
          </nuxt-link>
        </li>
      </ul>
    </li>

    <li>
      <button @click="toggleDropdown('processes')" type="button"
        class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
        <icon name="clarity:employee-group-solid"
          class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
          aria-hidden="true" />
        <span class="flex-1 ms-3 text-start whitespace-nowrap">HR Processes</span>
        <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
          :class="{ 'rotate-180': openDropdowns.processes }" aria-hidden="true" />
      </button>
      <ul v-if="openDropdowns.processes" class="py-2 space-y-2">
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg ps-11 group hover:bg-gray-800">
            Attendance
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg ps-11 group hover:bg-gray-800">
            Leave Management
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg ps-11 group hover:bg-gray-800">
            Payroll
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to=""
            class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg ps-11 group hover:bg-gray-800">
            Performance Reviews
          </nuxt-link>
        </li>
      </ul>
    </li>

    <li>
      <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
        <icon name="material-symbols-light:settings-rounded"
          class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" />
        <span class="flex-1 ms-3 whitespace-nowrap">Settings</span>
      </nuxt-link>
    </li>
  </div>
</template>

<script lang="ts" setup>
type DropdownNames = 'management' | 'processes'

// Track which dropdowns are open
const openDropdowns = reactive<Record<DropdownNames, boolean>>({
  management: true, // Open by default
  processes: false
})

const toggleDropdown = (name: DropdownNames) => {
  openDropdowns[name] = !openDropdowns[name]
}

// Make sure i18n is properly initialized
const { t } = useI18n();
console.log('Current translations available:', t('layouts.dashboard'));
</script>