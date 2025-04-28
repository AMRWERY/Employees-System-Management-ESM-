<template>
  <div>
    <div :class="{ 'rtl': isRTL }">
      <!-- Backdrop overlay for mobile - only visible when sidebar is open -->
      <div v-if="isSidebarOpen" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 sm:hidden"
        @click="isSidebarOpen = false"></div>

      <!-- Navbar - Now full width at the top -->
      <nav class="bg-gray-900 px-4 py-2.5 fixed w-full top-0 left-0 z-30 border-b border-gray-700">
        <div class="flex flex-wrap justify-between items-center">
          <div class="flex items-center justify-start">
            <button @click="toggleSidebar"
              class="p-2 text-gray-400 flex items-center rounded-lg sm:hidden hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700">
              <span class="sr-only">Toggle sidebar</span>
              <icon name="heroicons:bars-3-bottom-left-20-solid" class="w-6 h-6" aria-hidden="true" />
            </button>
            <span class="self-center text-xl font-semibold text-white ml-2.5">ESM</span>
          </div>

          <!-- Right side navbar items -->
          <div class="flex items-center">
            <!-- RTL Toggle -->
            <button @click="toggleDirection"
              class="text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-700 rounded-lg text-sm p-2.5 me-1">
              {{ isRTL ? 'LTR' : 'RTL' }}
            </button>

            <!-- User menu -->
            <div class="flex items-center ml-3">
              <div>
                <button type="button" class="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-700"
                  id="user-menu-button" aria-expanded="false">
                  <span class="sr-only">Open user menu</span>
                  <img class="w-8 h-8 rounded-full" src="https://justfields.com/storage/projects/7M5rV059/images.jpg"
                    alt="user-photo">
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Sidebar - now starts below the navbar -->
      <aside id="default-sidebar"
        class="fixed top-14 z-40 w-[262px] h-[calc(100vh-3.5rem)] transition-transform flex flex-col" :class="[
          isRTL ? 'right-0' : 'left-0',
          isSidebarOpen || isRTL ? 'translate-x-0' : '-translate-x-full',
          isRTL && !isSidebarOpen ? 'translate-x-full' : '',
          isRTL ? 'sm:translate-x-0' : 'sm:translate-x-0',
        ]" aria-label="Sidebar">
        <div
          class="flex-1 h-full px-3 py-4 overflow-y-auto bg-gray-900 text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ul class="space-y-2 font-medium">
            <!-- Admin sidebar -->
            <li>
              <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
                <icon name="material-symbols:dashboard"
                  class="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" aria-hidden="true" />
                <span class="flex-1 ms-3 whitespace-nowrap">Dashboard</span>
              </nuxt-link>
            </li>

            <li>
              <button @click="toggleDropdown('management')" type="button"
                class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
                <icon name="eos-icons:cluster-management"
                  class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
                  aria-hidden="true" />
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Management</span>
                <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
                  :class="{ 'rotate-180': openDropdowns.management }" aria-hidden="true" />
              </button>
              <ul v-if="openDropdowns.management" class="py-2 space-y-2">
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Employees
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Teams
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
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
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">HR Processes</span>
                <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
                  :class="{ 'rotate-180': openDropdowns.processes }" aria-hidden="true" />
              </button>
              <ul v-if="openDropdowns.processes" class="py-2 space-y-2">
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Attendance
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Leave Management
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Payroll
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

            <li>
              <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
                <icon name="material-symbols-light:settings-rounded"
                  class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" />
                <span class="flex-1 ms-3 whitespace-nowrap">Settings</span>
              </nuxt-link>
            </li>
            <!-- end Admin sidebar -->

            <!-- HR sidebar -->
            <li>
              <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
                <icon name="material-symbols:dashboard"
                  class="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" aria-hidden="true" />
                <span class="flex-1 ms-3 whitespace-nowrap">Dashboard</span>
              </nuxt-link>
            </li>

            <li>
              <button @click="toggleDropdown('management')" type="button"
                class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
                <icon name="eos-icons:cluster-management"
                  class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
                  aria-hidden="true" />
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Management</span>
                <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
                  :class="{ 'rotate-180': openDropdowns.management }" aria-hidden="true" />
              </button>
              <ul v-if="openDropdowns.management" class="py-2 space-y-2">
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Employees
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Teams
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
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">HR Processes</span>
                <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
                  :class="{ 'rotate-180': openDropdowns.processes }" aria-hidden="true" />
              </button>
              <ul v-if="openDropdowns.processes" class="py-2 space-y-2">
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Attendance
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Leave Management
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Payroll
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
            <!-- end HR sidebar -->

            <!-- Manager sidebar -->
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
            <!-- end Manager sidebar -->

            <!-- Employee sidebar -->
            <li>
              <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
                <icon name="material-symbols:dashboard"
                  class="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" aria-hidden="true" />
                <span class="flex-1 ms-3 whitespace-nowrap">Dashboard</span>
              </nuxt-link>
            </li>

            <li>
              <button @click="toggleDropdown('personal')" type="button"
                class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
                <icon name="icon-park-solid:personal-privacy"
                  class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
                  aria-hidden="true" />
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Personal</span>
                <icon name="material-symbols:keyboard-arrow-down-rounded" class="w-5 h-5"
                  :class="{ 'rotate-180': openDropdowns.personal }" aria-hidden="true" />
              </button>
              <ul v-if="openDropdowns.personal" class="py-2 space-y-2">
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    My Attendance
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    My Leave Requests
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    My Performance Reviews
                  </nuxt-link>
                </li>
              </ul>
            </li>

            <li>
              <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
                <icon name="solar:hand-money-linear"
                  class="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" aria-hidden="true" />
                <span class="flex-1 ms-3 whitespace-nowrap">My Payslips/Payroll</span>
              </nuxt-link>
            </li>
            <!-- end Employee sidebar -->
          </ul>
        </div>

        <!-- Logout Button at bottom of sidebar -->
        <div class="px-3 py-4 bg-gray-900 border-t border-gray-800">
          <nuxt-link to="" role="button" @click.prevent="handleLogout"
            class="flex items-center justify-center p-2 text-gray-800 rounded-lg border-2 border-gray-700 hover:border-white bg-white hover:bg-gray-100 transition-colors group">
            <span class="ms-3 whitespace-nowrap">Logout</span>
          </nuxt-link>
        </div>
      </aside>

      <!-- Main content container - updating to match the new layout -->
      <div :class="[
        'min-h-screen pt-16',
        isRTL ? 'sm:mr-64' : 'sm:ml-64',
      ]">
        <!-- No content here - this is just the container -->
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const isSidebarOpen = ref(false)
const isRTL = ref(false)

// Define the type for our dropdowns
type DropdownNames = 'dashboard' | 'users'

// Track which dropdowns are open
const openDropdowns = reactive<Record<DropdownNames, boolean>>({
  dashboard: true, // Open by default
  users: false
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleDirection = () => {
  isRTL.value = !isRTL.value
  document.documentElement.dir = isRTL.value ? 'rtl' : 'ltr'
}

const toggleDropdown = (name: DropdownNames) => {
  openDropdowns[name] = !openDropdowns[name]
}

const handleLogout = () => {
  console.log('Logging out...')
  // Close sidebar on mobile after logout action
  isSidebarOpen.value = false
}
</script>

<style scoped>
/* RTL fixes */
[dir="rtl"] .ms-3 {
  margin-right: 0.75rem !important;
  margin-left: 0 !important;
}

[dir="rtl"] .me-1 {
  margin-left: 0.25rem !important;
  margin-right: 0 !important;
}

[dir="rtl"] .ml-2\.5 {
  margin-right: 0.625rem !important;
  margin-left: 0 !important;
}

[dir="rtl"] .ml-3 {
  margin-right: 0.75rem !important;
  margin-left: 0 !important;
}

[dir="rtl"] .pl-11 {
  padding-right: 2.75rem !important;
  padding-left: 0 !important;
}
</style>