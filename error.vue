<template>
    <div>
        <div class="justify-center">
            <div class="flex flex-col items-center justify-center mt-24">
                <img src="/error-404.svg" alt="error-404" class="emoji-404" />

                <div class="mt-4 tracking-widest text-center">
                    <span class="block text-6xl text-gray-500"><span>{{ error.statusCode }}</span></span>
                    <span class="text-xl text-gray-500">{{
                        t('error_page.sorry_we_couldnt_find_what_you_are_looking_for') }}</span>
                </div>

                <div class="mt-6">
                    <base-button :default-icon="false" :type="'button'" :variant="'outline'" :inline="true"
                        :route="true" to="/">{{ t('btn.go_back_home') }}</base-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

defineProps(['error'])
</script>

<style scoped>
.emoji-404 {
    position: relative;
    animation: mymove 2.5s infinite;
}

@keyframes mymove {
    33% {
        top: 0px;
    }

    66% {
        top: 20px;
    }

    100% {
        top: 0px;
    }
}
</style>