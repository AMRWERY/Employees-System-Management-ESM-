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
              class="p-2 text-gray-400 rounded-lg sm:hidden hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700">
              <span class="sr-only">Toggle sidebar</span>
              <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path clip-rule="evenodd" fill-rule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z">
                </path>
              </svg>
            </button>
            <span class="self-center text-xl font-semibold text-white ml-2.5">ESM</span>
          </div>

          <!-- Right side navbar items -->
          <div class="flex items-center">
            <!-- RTL Toggle -->
            <button @click="toggleDirection"
              class="text-gray-400 hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-700 rounded-lg text-sm p-2.5 me-1">
              {{ isRTL ? 'LTR' : 'RTL' }}
            </button>

            <!-- User menu -->
            <div class="flex items-center ml-3">
              <div>
                <button type="button" class="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-700"
                  id="user-menu-button" aria-expanded="false">
                  <span class="sr-only">Open user menu</span>
                  <img class="w-8 h-8 rounded-full" src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                    alt="user photo">
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Sidebar - now starts below the navbar -->
      <aside id="default-sidebar"
        class="fixed top-14 z-40 w-64 h-[calc(100vh-3.5rem)] transition-transform flex flex-col" :class="[
          isRTL ? 'right-0' : 'left-0',
          isSidebarOpen || isRTL ? 'translate-x-0' : '-translate-x-full',
          isRTL && !isSidebarOpen ? 'translate-x-full' : '',
          isRTL ? 'sm:translate-x-0' : 'sm:translate-x-0',
        ]" aria-label="Sidebar">
        <div class="flex-1 h-full px-3 py-4 overflow-y-auto bg-gray-900 text-white">
          <ul class="space-y-2 font-medium">
            <!-- E-commerce Dropdown -->
            <li>
              <button @click="toggleDropdown('ecommerce')" type="button"
                class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
                <svg class="w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white" aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 21">
                  <path
                    d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z" />
                </svg>
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">E-commerce</span>
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 10 6" :class="{ 'rotate-180': openDropdowns.ecommerce }">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="m1 1 4 4 4-4" />
                </svg>
              </button>
              <ul v-if="openDropdowns.ecommerce" class="py-2 space-y-2">
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Products
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Billing
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    Invoice
                  </nuxt-link>
                </li>
              </ul>
            </li>

            <!-- Users Management Dropdown -->
            <li>
              <button @click="toggleDropdown('users')" type="button"
                class="flex items-center w-full p-2 text-base text-white transition duration-75 rounded-lg group hover:bg-gray-800">
                <svg class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
                  aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                  <path
                    d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Users</span>
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 10 6" :class="{ 'rotate-180': openDropdowns.users }">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="m1 1 4 4 4-4" />
                </svg>
              </button>
              <ul v-if="openDropdowns.users" class="py-2 space-y-2">
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    All Users
                  </nuxt-link>
                </li>
                <li>
                  <nuxt-link to=""
                    class="flex items-center w-full p-2 text-white transition duration-75 rounded-lg pl-11 group hover:bg-gray-800">
                    New User
                  </nuxt-link>
                </li>
              </ul>
            </li>

            <!-- Settings -->
            <li>
              <nuxt-link to="" class="flex items-center p-2 text-white rounded-lg hover:bg-gray-800 group">
                <svg class="flex-shrink-0 w-5 h-5 text-gray-400 transition duration-75 group-hover:text-white"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="flex-1 ms-3 whitespace-nowrap">Settings</span>
              </nuxt-link>
            </li>
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
import { ref, reactive } from 'vue'

const isSidebarOpen = ref(false)
const isRTL = ref(false)

// Define the type for our dropdowns
type DropdownNames = 'ecommerce' | 'users'

// Track which dropdowns are open
const openDropdowns = reactive<Record<DropdownNames, boolean>>({
  ecommerce: true, // Open by default
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