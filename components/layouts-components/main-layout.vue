<template>
  <div>
    <!-- Overlay Component -->
    <overlay :visible="localeStore.isOverlayVisible" />

    <div :class="{ 'rtl': localeStore.isRTL }">
      <!-- Backdrop overlay for mobile - only visible when sidebar is open -->
      <div v-if="isSidebarOpen" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 sm:hidden"
        @click="isSidebarOpen = false"></div>

      <!-- Navbar - Now full width at the top -->
      <nav class="bg-gray-900 px-4 py-2.5 fixed w-full top-0 start-0 z-30 border-b border-gray-700">
        <div class="flex flex-wrap justify-between items-center">
          <div class="flex items-center justify-start">
            <button @click="toggleSidebar"
              class="p-2 text-gray-400 flex items-center rounded-lg sm:hidden hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700">
              <span class="sr-only">Toggle sidebar</span>
              <icon name="heroicons:bars-3-bottom-left-20-solid" class="w-6 h-6" aria-hidden="true" />
            </button>
            <span class="self-center text-xl font-semibold text-white ms-2.5">ESM</span>
          </div>

          <!-- Right side navbar items -->
          <div class="flex items-center gap-2">
            <!-- RTL Toggle -->
            <button
              class="text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-700 rounded-lg text-sm p-2.5 me-1"
              @click="switchLocale(localeStore.isRTL ? 'en' : 'ar')">
              <span v-if="localeStore.isRTL" class="flex items-center">
                <icon name="heroicons:language" class="w-4 h-4 me-1.5" />
                En
              </span>
              <span v-else class="flex items-center">
                <icon name="heroicons:language" class="w-4 h-4 me-1.5" />
                العربية
              </span>
            </button>

            <!-- User menu -->
            <div class="flex items-center ms-3">
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
    localeStore.isRTL ? 'right-0' : 'left-0',
    isSidebarOpen ? 'translate-x-0' : (localeStore.isRTL ? 'translate-x-full' : '-translate-x-full'),
    'sm:translate-x-0',
  ]" aria-label="Sidebar">
        <div
          class="flex-1 h-full px-3 py-4 overflow-y-auto bg-gray-900 text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ul class="space-y-2 font-medium">
            <!-- admin-sidebar-tabs component -->
            <admin-sidebar-tabs />

            <!-- hr-sidebar-tabs component -->
            <hr-sidebar-tabs />

            <!-- Mmanager-sidebar-tabs component -->
            <manager-sidebar-tabs />

            <!-- employee-sidebar-tabs component -->
            <employee-sidebar-tabs />
          </ul>
        </div>

        <!-- Logout Button at bottom of sidebar -->
        <div class="px-3 py-4 bg-gray-900 border-t border-gray-800">
          <nuxt-link to="" role="button" @click.prevent="handleLogout"
            class="flex items-center justify-center p-2 text-gray-800 rounded-lg border-2 border-gray-700 hover:border-white bg-white hover:bg-gray-100 transition-colors group">
            <span class="ms-3 whitespace-nowrap">{{ $t('btn.logout') }}</span>
          </nuxt-link>
        </div>
      </aside>

      <!-- Main content container - updating to match the new layout -->
      <div :class="[
        'min-h-screen pt-16',
        localeStore.isRTL ? 'sm:mr-64' : 'sm:ml-64',
      ]">
        <!-- No content here - this is just the container -->
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { setLocale, setLocaleMessage } = useI18n();
const localeStore = useLocaleStore();
const authStore = useAuthStore();
const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleLogout = async () => {
  try {
    await authStore.logoutUser();
    navigateTo('/auth/login');
  } catch (err) {
    console.error('Error during logout:', err);
  }
};

// Watch for changes in the RTL state and update document direction
watch(() => localeStore.isRTL, (isRTL) => {
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
}, { immediate: true });

const switchLocale = async (value: SupportedLocale) => {
  localeStore.updateLocale(value);
  // Get i18n instance and ensure messages are loaded
  if (value === 'ar') {
    const arMessages = await import('~/locales/ar.json');
    setLocaleMessage('ar', arMessages.default || arMessages);
  } else {
    const enMessages = await import('~/locales/en.json');
    setLocaleMessage('en', enMessages.default || enMessages);
  }
  // Now set the locale
  setLocale(value);
};

// Initialize direction on component mount
onMounted(() => {
  document.documentElement.dir = localeStore.isRTL ? 'rtl' : 'ltr';
});
</script>

<style scoped>
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