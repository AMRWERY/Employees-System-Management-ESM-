import { useNuxtApp } from '#app'

export const usePdf = () => {
  const { $html2pdf } = useNuxtApp()

  const exportToPdf = async (element: HTMLElement, options = {}, filename = 'document.pdf') => {
    // Default options
    const defaultOptions = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    // Merge options
    const mergedOptions = { ...defaultOptions, ...options }

    try {
      return await $html2pdf().from(element).set(mergedOptions).save()
    } catch (error) {
      // console.error('Error exporting to PDF:', error)
      throw error
    }
  }

  return {
    exportToPdf
  }
} 