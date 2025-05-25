<template>
    <div>
        <p>settings</p>
    </div>
</template>

<script setup>
const { t } = useI18n()

useHead({
    titleTemplate: () => t('head.settings'),
})
</script>