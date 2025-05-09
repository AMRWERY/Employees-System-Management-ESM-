<template>
    <div>
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <icon :name="icon" width="124" height="124" class="mb-4 text-gray-400" />
            <p class="text-2xl font-semibold text-gray-800">{{ message }}</p>
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
defineProps({
    message: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: 'tabler:database-off'
    }
});
</script>