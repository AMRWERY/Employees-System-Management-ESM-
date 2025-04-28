<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="flex w-full max-w-4xl rounded-lg shadow-xl overflow-hidden">
      <!-- Left Side - Dark Background with Information -->
      <div
        class="hidden md:flex md:w-4/12 bg-gradient-to-l from-gray-900 to-gray-600 text-white p-10 flex-col justify-center">
        <div class="max-w-md mx-auto">
          <h1 class="text-3xl font-bold mb-4">{{ $t('form.create_your_account') }}</h1>
          <p class="text-gray-300 mb-10">
            {{ $t('form.welcome_message') }}
          </p>

          <h2 class="text-2xl font-bold mb-4">{{ $t('form.simple_secure') }}</h2>
          <p class="text-gray-300">
            {{ $t('form.security_message') }}
          </p>
        </div>
      </div>

      <!-- Right Side - Form -->
      <div class="w-full md:w-8/12 p-4 flex items-center justify-center bg-white">
        <div class="w-full max-w-lg">
          <h2 class="text-2xl font-semibold text-gray-800 mb-8">{{ $t('form.create_account') }}</h2>

          <form>
            <div class="mb-6">
              <label for="name" class="block text-gray-700 mb-2">{{ $t('form.name') }}</label>
              <div class="relative">
                <input id="name" type="text"
                  class="bg-slate-100 w-full text-sm text-slate-800 px-4 py-3 rounded-md outline-none border focus:border-blue-600 focus:bg-transparent"
                  :placeholder="$t('form.name_placeholder')" />
              </div>
            </div>

            <!-- Email Field -->
            <div class="mb-6">
              <label for="email" class="block text-gray-700 mb-2">{{ $t('form.email') }}</label>
              <div class="relative">
                <input id="email" type="email"
                  class="bg-slate-100 w-full text-sm text-slate-800 px-4 py-3 rounded-md outline-none border focus:border-blue-600 focus:bg-transparent"
                  :placeholder="$t('form.email_placeholder')" />
              </div>
            </div>

            <!-- Password Field -->
            <div class="mb-6">
              <label for="password" class="block text-gray-700 mb-2">{{ $t('form.password') }}</label>
              <div class="relative">
                <input id="password"
                  class="bg-slate-100 w-full text-sm text-slate-800 px-4 py-3 rounded-md outline-none border focus:border-blue-600 focus:bg-transparent"
                  :placeholder="$t('form.password_placeholder')" />
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="mb-6 flex items-start">
              <div class="flex items-center h-5">
                <input id="terms" type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
              </div>
              <label for="terms" class="ms-3 block text-sm text-slate-500">
                {{ $t('form.accept_terms') }}
                <nuxt-link-locale to="" class="text-blue-600 hover:underline">{{
                  $t('form.terms_and_conditions') }}</nuxt-link-locale>
              </label>
            </div>

            <!-- Submit Button -->
            <button type="submit"
              class="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
              {{ $t('btn.create_account_button') }}
            </button>

            <!-- Login Link -->
            <div class="mt-6 text-center">
              <p class="text-sm text-slate-500">
                {{ $t('form.already_have_account') }}
                <nuxt-link to="/auth/login" class="text-blue-600 font-medium hover:underline ms-1">
                  {{ $t('form.login_here') }}
                </nuxt-link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

definePageMeta({
  layout: 'auth'
});

useHead({
  titleTemplate: () => t('head.sign_up'),
});
</script>