<template>
  <div>
    <!-- Overlay Component -->
    <overlay :visible="localeStore.isOverlayVisible" />

    <div :class="{ 'rtl': localeStore.isRTL }">
      <!-- Backdrop overlay for mobile - only visible when sidebar is open -->
      <div v-if="isSidebarOpen" class="fixed inset-0 bg-opacity-50 z-30 sm:hidden" @click="isSidebarOpen = false"></div>

      <!-- Navbar - Now full width at the top -->
      <nav class="layout-bg px-4 py-2.5 fixed w-full top-0 start-0 z-30 border-b border-gray-700">
        <div class="flex flex-wrap justify-between items-center">
          <div class="flex items-center justify-start">
            <button @click="toggleSidebar"
              class="p-2 text-gray-300 flex items-center rounded-lg sm:hidden focus:outline-none focus:ring-2 focus:ring-gray-700">
              <span class="sr-only">Toggle sidebar</span>
              <icon name="heroicons:bars-3-bottom-left-20-solid" class="w-6 h-6" aria-hidden="true" />
            </button>
            <nuxt-link to="/" class="self-center text-3xl font-semibold text-white ms-2.5">ESM</nuxt-link>
          </div>

          <!-- Right side navbar items -->
          <div class="flex items-center gap-2">
            <!-- RTL Toggle -->
            <button class="text-gray-100 rounded-lg text-sm p-2.5 me-1"
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
                <nuxt-link-locale to="/profile" type="button" class="flex text-sm rounded-full" id="user-menu-button"
                  aria-expanded="false">
                  <span class="sr-only">Open user menu</span>
                  <img class="w-8 h-8 rounded-full" :src="profileImage" alt="user-photo">
                </nuxt-link-locale>
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
          class="flex-1 h-full px-3 py-4 overflow-y-auto layout-bg text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ul class="space-y-2 font-medium">
            <!-- admin-sidebar-tabs component -->
            <admin-sidebar-tabs />

            <!-- hr-sidebar-tabs component -->
            <hr-sidebar-tabs />

            <!-- Mmanager-sidebar-tabs component -->
            <manager-sidebar-tabs />

            <!-- employee-sidebar-tabs component -->
            <employee-sidebar-tabs />

            <!-- accountant-sidebar-tabs component -->
            <accountant-sidebar-tabs />
          </ul>
        </div>

        <!-- Logout Button at bottom of sidebar -->
        <div class="px-3 py-4 layout-bg border-t border-gray-800">
          <nuxt-link to="" role="button" @click.prevent="handleLogout"
            class="flex items-center justify-center p-2 text-gray-800 rounded-lg border-2 border-gray-700 hover:border-white bg-white hover:bg-gray-100 transition-colors group">
            <span class="ms-3 whitespace-nowrap">{{ t('btn.logout') }}</span>
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
const { setLocale, setLocaleMessage, t } = useI18n();
const localeStore = useLocaleStore();
const authStore = useAuthStore();
const profileStore = useProfileStore();
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

// Get user data from session storage
const userData = sessionStorage.getItem('user')
const parsedUserData = ref(userData ? JSON.parse(userData) : null)

onMounted(() => {
  profileStore.initializeProfileImage();
});

const defaultProfileImg = '/dummy-profile-img.jpg'

const profileImage = computed(() => {
  if (profileStore.imagePreviewUrl) {
    return profileStore.imagePreviewUrl;
  }
  if (authStore.user?.profileImg) {
    return authStore.user.profileImg;
  }
  if (parsedUserData.value?.profileImg) {
    return parsedUserData.value.profileImg;
  }
  return defaultProfileImg;
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