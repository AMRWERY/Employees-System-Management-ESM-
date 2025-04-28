<template>
  <div>
    <div class="min-h-screen flex fle-col items-center justify-center py-6 px-4">
      <div class="grid md:grid-cols-2 items-center gap-10 max-w-6xl max-md:max-w-md w-full">
        <div class="text-center">
          <h2 class="lg:text-5xl text-3xl font-bold lg:leading-[57px] text-slate-900">
            {{ $t('form.empower_your_hr_team_with_centralized_control') }}
          </h2>
          <p class="text-sm mt-6 text-slate-500 leading-relaxed">{{
            $t('form.i_streamline_workforce_management_through_our_comprehensive_employee_system_platform_track_attendance_manage_payroll_monitor_performance_and_optimize_team_structures_from_a_single_unified_interface')
            }}</p>
          <p class="text-sm mt-6 md:mt-12 text-slate-500">{{ $t('form.do_not_have_an_account') }}
            <nuxt-link-locale to="/auth/sign-up" class="text-blue-600 font-medium hover:underline ms-1">{{ $t('form.register_here')
              }}</nuxt-link-locale>
          </p>
        </div>

        <form class="max-w-md md:ms-auto w-full text-end">
          <h3 class="text-slate-900 lg:text-3xl text-2xl font-bold mb-8">
            {{ $t('form.sign_in') }}
          </h3>
          <div class="space-y-6">
            <div>
              <label class='text-sm text-slate-800 font-medium mb-2 block'>{{ $t('form.email') }}</label>
              <input name="email" type="email" required
                class="bg-slate-100 w-full text-sm text-slate-800 px-4 py-3 rounded-md outline-none border focus:border-blue-600 focus:bg-transparent"
                :placeholder="t('form.enter_your_email')" />
            </div>
            <div>
              <label class='text-sm text-slate-800 font-medium mb-2 block'>{{ $t('form.password') }}</label>
              <input name="password" type="password" required
                class="bg-slate-100 w-full text-sm text-slate-800 px-4 py-3 rounded-md outline-none border focus:border-blue-600 focus:bg-transparent"
                :placeholder="t('form.enter_your_password')" />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                <label for="remember-me" class="ms-3 block text-sm text-slate-500">
                  {{ $t('form.remember_me') }}
                </label>
              </div>
              <div class="text-sm">
                <nuxt-link to="" class="text-blue-600 hover:text-blue-500 font-medium">
                  {{ $t('form.forgot_your_password') }}
                </nuxt-link>
              </div>
            </div>
          </div>

          <div class="!mt-7">
            <button type="submit"
              class="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
              {{ $t('btn.log_in') }}
            </button>
          </div>

          <div class="my-4 flex items-center gap-4">
            <hr class="w-full border-slate-300" />
            <p class="text-sm text-slate-800 text-center">{{ $t('form.or') }}</p>
            <hr class="w-full border-slate-300" />
          </div>

          <div class="space-s-6 flex justify-center">
            <button type="button" class="border-none outline-none">
              <icon name="devicon:google" class="w-6 h-6" />
            </button>
            <button type="button" class="border-none outline-none">
              <icon name="logos:facebook" class="w-6 h-6" />
            </button>
            <button type="button" class="border-none outline-none">
              <icon name="logos:apple" class="w-6 h-6" />
            </button>
          </div>
        </form>
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
  titleTemplate: () => t('head.sign_in'),
});
</script>