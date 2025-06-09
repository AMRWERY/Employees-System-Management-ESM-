<template>
  <div>
    <div class="relative w-max mx-auto" ref="dropdown">
      <button type="button" @click="isOpen = !isOpen"
        class="px-5 py-2.5 rounded text-sm font-medium border border-slate-300 cursor-pointer outline-0 hover:bg-slate-50 flex items-center">
        {{ t('menu.download') }}
        <icon name="ic:sharp-keyboard-arrow-down" class="w-5 h-5 ms-3" />
      </button>

      <ul v-show="isOpen"
        class="absolute block shadow-lg bg-white py-2 px-2 z-[1000] min-w-full w-max rounded-sm max-h-96 overflow-auto">
        <li class="dropdown-item py-2.5 px-4 hover:bg-slate-100 rounded-sm text-sm font-medium cursor-pointer">
          <div class="flex items-center">
            <div class="flex items-center gap-3">
              <icon name="vscode-icons:file-type-pdf2" />
              {{ t('menu.download_as_pdf') }}
            </div>
          </div>
        </li>
        <li class="dropdown-item py-2.5 px-4 hover:bg-slate-100 rounded-sm text-sm font-medium cursor-pointer">
          <div class="flex items-center">
            <div class="flex items-center gap-3">
              <icon name="vscode-icons:file-type-excel" />
              {{ t('menu.download_as_excel') }}
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

const isOpen = ref(false);

// Close dropdown when clicking outside
const dropdown = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (dropdown.value && !dropdown.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>