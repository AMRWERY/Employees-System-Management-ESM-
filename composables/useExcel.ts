import { useNuxtApp } from '#app'

export const useExcel = () => {
  const { $xlsx } = useNuxtApp()

  /**
   * Export data to Excel file
   * @param data Array of objects to export
   * @param filename Name of the file to download
   * @param sheetName Name of the sheet
   */
  const exportToExcel = (data: any[], filename = 'data.xlsx', sheetName = 'Sheet1') => {
    try {
      // Convert data to worksheet
      const worksheet = $xlsx.utils.json_to_sheet(data)
      
      // Create workbook and add the worksheet
      const workbook = $xlsx.utils.book_new()
      $xlsx.utils.book_append_sheet(workbook, worksheet, sheetName)
      
      // Generate and download file
      $xlsx.writeFile(workbook, filename)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      throw error
    }
  }

  /**
   * Export HTML table to Excel file
   * @param tableElement HTML table element to export
   * @param filename Name of the file to download
   * @param sheetName Name of the sheet
   */
  const exportTableToExcel = (tableElement: HTMLTableElement, filename = 'table.xlsx', sheetName = 'Sheet1') => {
    try {
      // Convert table to worksheet
      const worksheet = $xlsx.utils.table_to_sheet(tableElement)
      
      // Create workbook and add the worksheet
      const workbook = $xlsx.utils.book_new()
      $xlsx.utils.book_append_sheet(workbook, worksheet, sheetName)
      
      // Generate and download file
      $xlsx.writeFile(workbook, filename)
    } catch (error) {
      console.error('Error exporting table to Excel:', error)
      throw error
    }
  }

  return {
    exportToExcel,
    exportTableToExcel
  }
} 