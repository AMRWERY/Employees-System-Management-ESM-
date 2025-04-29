<template>
  <div>
    <div class="relative w-max mx-auto">
      <button type="button" ref="toggleButton" @click.stop="toggleDropdown"
        class="px-5 py-2.5 border border-gray-300 text-slate-900 text-sm font-medium outline-none bg-white hover:bg-gray-50 flex items-center justify-between min-w-[190px] w-full">
        {{ $t('btn.download_data') }}
        <icon name="ic:sharp-keyboard-arrow-down" class="w-5 text-gray-500 ms-3 transition-transform"
          :class="{ 'rotate-180': isOpen }" />
      </button>

      <ul ref="dropdownMenu"
        class="absolute shadow-[0_8px_19px_-7px_rgba(6,81,237,0.2)] bg-white py-2 z-[1000] divide-y max-h-96 overflow-auto w-full"
        :class="{ 'hidden': !isOpen, 'block': isOpen }">
        <li v-for="(item, index) in dropdownItems" :key="index"
          class="dropdown-item py-3 px-5 hover:bg-gray-50 text-slate-900 text-sm font-medium cursor-pointer flex items-center gap-2"
          @click="handleItemClick(item)">
          <Icon :name="item.icon" />
          {{ item.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface DropdownItem {
  title: string;
  icon: string;
}

const { t } = useI18n()
const isOpen = ref(false)
const toggleButton = ref<HTMLElement | null>(null)
const dropdownMenu = ref<HTMLElement | null>(null)

const { exportToPdf } = usePdf()
const { exportTableToExcel } = useExcel()

const dropdownItems = ref<DropdownItem[]>([
  { title: t('menu.download_as_pdf'), icon: 'vscode-icons:file-type-pdf2' },
  { title: t('menu.download_as_excel'), icon: 'vscode-icons:file-type-excel' },
])

// Props for target table ID and filename
const props = defineProps({
  tableId: {
    type: String,
    default: 'dataTable'
  },
  filename: {
    type: String,
    default: 'table-data'
  }
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleItemClick = (item: DropdownItem) => {
  if (item.title === t('menu.download_as_pdf')) {
    downloadPdf()
  } else if (item.title === t('menu.download_as_excel')) {
    downloadExcel()
  }
  closeDropdown()
}

const downloadPdf = () => {
  const tableElement = document.getElementById(props.tableId)
  if (tableElement) {
    console.log('Exporting table to PDF:', props.tableId, props.filename)
    try {
      exportToPdf(tableElement, {
        filename: `${props.filename}.pdf`,
        margin: 10,
        jsPDF: { format: 'a4', orientation: 'landscape' }
      })
    } catch (error) {
      console.error('Error exporting to PDF:', error)
    }
  } else {
    console.error(`Table with ID ${props.tableId} not found`)
  }
}

const downloadExcel = () => {
  const tableElement = document.getElementById(props.tableId) as HTMLTableElement
  if (tableElement) {
    console.log('Exporting table to Excel:', props.tableId, props.filename)
    try {
      exportTableToExcel(tableElement, `${props.filename}.xlsx`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    }
  } else {
    console.error(`Table with ID ${props.tableId} not found`)
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    dropdownMenu.value &&
    !dropdownMenu.value.contains(event.target as Node) &&
    toggleButton.value &&
    !toggleButton.value.contains(event.target as Node)
  ) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>