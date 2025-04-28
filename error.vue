<template>
    <div>
        <div class="relative h-screen overflow-hidden bg-indigo-900">
            <img src="https://external-preview.redd.it/4MddL-315mp40uH18BgGL2-5b6NIPHcDMBSWuN11ynM.jpg?width=960&crop=smart&auto=webp&s=b98d54a43b3dac555df398588a2c791e0f3076d9"
                class="absolute object-cover w-full h-full" />
            <div class="absolute inset-0 bg-black opacity-25"></div>
            <div class="container relative z-10 flex items-center px-6 py-32 mx-auto md:px-12 xl:py-40">
                <div class="relative z-10 flex flex-col items-center w-full font-mono">
                    <h1 class="mt-4 text-5xl font-extrabold leading-tight text-center text-white">{{
                        $t('error_page.you_are_all_alone_here') }}
                    </h1>
                    <p class="my-12 font-extrabold text-white text-8xl animate-bounce">{{ error.statusCode }}</p>
                    <p class="mb-6 text-4xl font-extrabold text-white">{{ error.statusMessage }}</p>
                    <nuxt-link-locale to="/"
                        class="inline-block px-5 py-3 mt-6 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring">
                        go_back_home
                    </nuxt-link-locale>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps(['error'])
</script>