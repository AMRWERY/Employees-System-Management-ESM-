<template>
  <div>
    <div class="relative w-max mx-auto" ref="dropdownContainer">
      <button type="button" @click="isOpen = !isOpen"
        class="px-5 py-2.5 rounded text-sm font-medium border border-slate-300 cursor-pointer outline-0 bg-white hover:bg-slate-50 flex items-center">
        {{ t('menu.download') }}
        <icon name="ic:sharp-keyboard-arrow-down" class="w-5 h-5 ms-3" />
      </button>
      <ul v-show="isOpen"
        class="absolute block shadow-lg bg-white py-2 px-2 z-[1000] min-w-full w-max rounded-sm max-h-96 overflow-auto mt-1">
        <li @click="downloadData('pdf')"
          class="dropdown-item py-2.5 px-4 hover:bg-slate-100 rounded-sm text-sm font-medium cursor-pointer">
          <div class="flex items-center">
            <div class="flex items-center gap-3">
              <icon name="vscode-icons:file-type-pdf2" />
              {{ t('menu.download_as_pdf') }}
            </div>
          </div>
        </li>
        <li @click="downloadData('excel')"
          class="dropdown-item py-2.5 px-4 hover:bg-slate-100 rounded-sm text-sm font-medium cursor-pointer">
          <div class="flex items-center">
            <div class="flex items-center gap-3">
              <icon name="vscode-icons:file-type-excel" />
              {{ t('menu.download_as_excel') }}
            </div>
          </div>
        </li>
      </ul>
    </div>
    <!-- Hidden table for PDF export -->
    <div ref="exportableTableContainer" style="display: none"></div>
  </div>
</template>

<script lang="ts" setup>
import { useNuxtApp } from '#app';
import type { Column } from '@/types/tables';

const props = defineProps<{
  allItems: Array<any>;
  columns: Column<any>[];
  fileNameBase?: string;
}>();

const { t, n } = useI18n();
const { triggerToast } = useToast();
const { $html2pdf, $xlsx } = useNuxtApp();

const isOpen = ref(false);
const dropdownContainer = ref<HTMLElement | null>(null);
const exportableTableContainer = ref<HTMLElement | null>(null);

// --- Use props directly ---
const allItemsToExport = computed(() => props.allItems || []);
const fileNameToUse = computed(() => {
  const base = props.fileNameBase || 'exported_data';
  return `${base}_${new Date().toISOString().split('T')[0]}`;
});

const exportableColumns = computed(() => {
  return props.columns.filter(col => col.key && col.key !== 'actions');
});

const getFormattedCellValue = (item: any, column: Column<any>, index: number): string => {
  if (column.format) {
    try {
      const formatted = column.format(item, index);
      return String(formatted ?? '');
    } catch (e) {
      if (typeof column.key === 'string' && column.key.includes('.')) {
        // Handle nested
        const keys = column.key.split('.');
        let value = item;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else { return ''; }
        }
        return String(value ?? '');
      }
      return String(item[column.key as keyof typeof item] ?? '');
    }
  }
  if (typeof column.key !== 'string') {
    if (item && column.key in item) {
      return String(item[column.key as keyof typeof item] ?? '');
    }
    return '';
  }
  const keys = column.key.split('.');
  let value = item;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return '';
    }
  }
  return String(value ?? '');
};

const exportToPdf = async (headers: string[], dataRows: string[][], fileName: string): Promise<boolean> => {
  if (!exportableTableContainer.value || !$html2pdf) return false;
  try {
    let tableHtml = `<style>\n      table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }\n      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n      th { background-color: #f2f2f2; }\n    </style><table><thead><tr>`;
    headers.forEach(header => { tableHtml += `<th>${header}</th>`; });
    tableHtml += '</tr></thead><tbody>';
    dataRows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach(cell => { tableHtml += `<td>${cell}</td>`; });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    exportableTableContainer.value.innerHTML = tableHtml;
    const element = exportableTableContainer.value.querySelector('table');
    if (element) {
      const opt = {
        margin: 0.5,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await $html2pdf().from(element).set(opt).save();
      exportableTableContainer.value.innerHTML = '';
      return true;
    } else {
      exportableTableContainer.value.innerHTML = '';
      return false;
    }
  } catch (err) {
    if (exportableTableContainer.value) exportableTableContainer.value.innerHTML = '';
    return false;
  }
};

const exportToExcel = (headers: string[], dataRows: string[][], fileName: string): boolean => {
  if (!$xlsx) return false;
  try {
    const wsData = [headers, ...dataRows];
    const ws = $xlsx.utils.aoa_to_sheet(wsData);
    const wb = $xlsx.utils.book_new();
    $xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    $xlsx.writeFile(wb, `${fileName}.xlsx`);
    return true;
  } catch (err) {
    return false;
  }
};

const downloadData = async (format: 'pdf' | 'excel') => {
  isOpen.value = false;
  if (!allItemsToExport.value || allItemsToExport.value.length === 0) {
    triggerToast({
      message: t('toast.no_data_to_export', 'No data to export.'),
      type: 'warning',
      icon: 'ic:baseline-warning',
    });
    return;
  }
  const headers = exportableColumns.value.map(col => col.label || String(col.key));
  const dataRows = allItemsToExport.value.map((item, index) => {
    return exportableColumns.value.map(col => getFormattedCellValue(item, col, index));
  });
  const fileName = fileNameToUse.value;
  let success: boolean = false;
  try {
    if (format === 'pdf') {
      success = await exportToPdf(headers, dataRows, fileName);
    } else if (format === 'excel') {
      success = exportToExcel(headers, dataRows, fileName);
    }
    if (success) {
      triggerToast({
        message: t('toast.download_successful', `${fileName}.${format}`),
        type: 'success',
        icon: 'mdi:check-circle-outline',
      });
    } else {
      triggerToast({
        message: t('toast.download_error'),
        type: 'error',
        icon: 'material-symbols:error-outline-rounded',
      });
    }
  } catch (error: any) {
    triggerToast({
      message: t('toast.download_error'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};
onMounted(() => { document.addEventListener('click', handleClickOutside); });

onBeforeUnmount(() => { document.removeEventListener('click', handleClickOutside); });
</script>