<template>
  <div>
    <div class="flex items-center justify-center min-h-screen p-6">
      <div id="content" role="main" class="w-full max-w-md">
        <div class="mt-7 bg-white rounded-xl shadow-lg border-2 border-indigo-300">
          <div class="p-4 sm:p-7">
            <div class="text-center">
              <h1 class="block text-2xl font-bold text-gray-800">{{ $t('form.forgot_password') }}</h1>
            </div>

            <div class="mt-5">
              <form>
                <div class="grid gap-y-4">
                  <div>
                    <label for="email" class="text-sm text-slate-800 font-medium mb-2 block">{{ $t('form.email')
                      }}</label>
                    <div class="relative">
                      <input type="email" id="email" name="email"
                        class="bg-slate-100 w-full text-sm text-slate-800 px-4 py-3 rounded-md outline-none border focus:border-blue-600 focus:bg-transparent"
                        :placeholder="t('form.enter_your_email')">
                    </div>
                  </div>
                  <button type="submit"
                    class="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">{{
                      $t('btn.reset_password') }}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

definePageMeta({
  layout: 'auth'
});

useHead({
  titleTemplate: () => t('head.reset_password'),
});
</script>