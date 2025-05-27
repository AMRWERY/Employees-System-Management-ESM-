<template>
    <div>
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table class="w-full text-sm text-gray-500 text-start">
                <thead class="text-xs text-gray-700 capitalize bg-gray-50">
                    <tr>
                        <th v-for="(header, index) in headers" :key="index" scope="col" class="px-6 py-3">
                            <div class="w-24 h-4 bg-gray-300 rounded-full animate-pulse"></div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows" :key="row" class="bg-white border-b border-gray-200">
                        <td v-for="(header, index) in headers" :key="index" class="px-6 py-4">
                            <div class="flex items-center space-x-3">
                                <div v-if="header.type === 'image'"
                                    class="w-12 h-12 bg-gray-300 rounded-lg animate-pulse"></div>
                                <div v-else-if="header.type === 'action'" class="flex gap-3">
                                    <div class="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                                <div v-else class="h-4 bg-gray-300 rounded animate-pulse"
                                    :class="header.loaderWidth || 'w-24'"></div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { TableHeader } from '@/types/table-header'

defineProps({
    headers: {
        type: Array as PropType<TableHeader[]>,
        required: true,
        default: () => []
    },
    rows: {
        type: Number,
        default: 5
    }
})
</script>