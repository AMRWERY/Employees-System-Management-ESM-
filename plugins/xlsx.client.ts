import { defineNuxtPlugin } from '#app'
import * as XLSX from 'xlsx'

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      xlsx: XLSX
    }
  }
}) 