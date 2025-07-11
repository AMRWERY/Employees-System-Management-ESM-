<template>
  <div>
    <div class="min-h-screen flex fle-col items-center justify-center py-6 px-4">
      <div class="grid md:grid-cols-2 items-center gap-10 max-w-6xl max-md:max-w-md w-full">
        <div class="text-center">
          <h2 class="lg:text-5xl text-3xl font-bold lg:leading-[57px] text-slate-900">
            {{ t('form.empower_your_hr_team_with_centralized_control') }}
          </h2>
          <p class="text-sm mt-6 text-slate-500 leading-relaxed">{{
            t('form.i_streamline_workforce_management_through_our_comprehensive_employee_system_platform_track_attendance_manage_payroll_monitor_performance_and_optimize_team_structures_from_a_single_unified_interface')
          }}</p>
          <p class="text-sm mt-6 md:mt-8 text-slate-500">{{ t('form.do_not_have_an_account') }}
            <nuxt-link-locale to="/auth/sign-up" class="text-blue-600 font-medium hover:underline ms-1">{{
              t('form.register_here')
            }}</nuxt-link-locale>
          </p>
        </div>

        <div class="max-w-lg md:ms-auto w-full text-end">
          <h3 class="text-slate-900 lg:text-3xl text-2xl font-bold mb-8">
            {{ t('form.sign_in') }}
          </h3>
          <div class="space-y-6">
            <ClientOnly>
              <div class="grid col-span-1 sm:grid-cols-6 gap-x-6">
                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.email')" :placeholder="t('form.enter_your_email')" type="email"
                    name="email" :rules="'required|email'" :required="true" v-model="email" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.password')" placeholder="••••••••" type="password" name="password"
                    :rules="'required|minLength:7'" :required="true" v-model="password" />
                </div>
              </div>
            </ClientOnly>

            <div class="flex flex-wrap items-center justify-between gap-4">
              <!-- <div class="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                <label for="remember-me" class="ms-3 block text-sm text-slate-500">
                  {{ t('form.remember_me') }}
                </label>
              </div> -->
              <div class="text-sm ms-auto">
                <nuxt-link-locale to="/auth/forget-password" class="text-blue-600 hover:text-blue-500 font-medium">
                  {{ t('form.forgot_your_password') }}
                </nuxt-link-locale>
              </div>
            </div>
          </div>

          <div class="!mt-7">
            <!-- base-button component -->
            <base-button :default-icon="false" :block="true" type="submit" :disabled="loading" @click="handleLogin">
              <icon name="svg-spinners:270-ring-with-bg" v-if="loading" />
              <span v-else>{{ t('btn.log_in') }}</span>
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const authStore = useAuthStore()
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const { triggerToast } = useToast();
const { isLoading: loading, startLoading } = useLoading(3000)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = t('toast.all_fields_are_required')
    return
  }
  startLoading()
  try {
    await authStore.loginUser(email.value, password.value);
    triggerToast({
      message: t('toast.successfully_login'),
      type: 'success',
      icon: 'mdi-check-circle',
    });
    setTimeout(() => {
      navigateTo('/');
    }, 3000);
    authStore.setWelcomeType('login');
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_login'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  authStore.init();
});

definePageMeta({
  layout: 'auth'
});

useHead({
  titleTemplate: () => t('head.sign_in'),
});
</script>