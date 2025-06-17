<template>
  <div>
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="flex w-full max-w-4xl rounded-lg shadow-xl overflow-hidden">
        <!-- Left Side - Dark Background with Information -->
        <div
          class="hidden md:flex md:w-4/12 bg-gradient-to-l from-gray-900 to-gray-600 text-white p-10 flex-col justify-center">
          <div class="max-w-md mx-auto">
            <h1 class="text-3xl font-bold mb-4">{{ t('form.create_your_account') }}</h1>
            <p class="text-gray-300 mb-10">
              {{ t('form.welcome_message') }}
            </p>

            <h2 class="text-2xl font-bold mb-4">{{ t('form.simple_secure') }}</h2>
            <p class="text-gray-300">
              {{ t('form.security_message') }}
            </p>
          </div>
        </div>

        <!-- Right Side - Form -->
        <div class="w-full md:w-8/12 p-4 flex items-center justify-center bg-white">
          <div class="w-full max-w-lg">
            <h2 class="text-2xl font-semibold text-gray-800 mb-8">{{ t('form.create_account') }}</h2>

            <div class="space-y-4">
              <ClientOnly>
                <div class="grid col-span-1 sm:grid-cols-6 gap-x-6">
                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.first_name')" :placeholder="t('form.enter_your_first_name')"
                      type="text" :name="t('form.first_name')" :rules="'required|alpha_spaces'" :required="true"
                      v-model="firstName" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.middle_name')" :placeholder="t('form.enter_your_middle_name')"
                      type="text" :name="t('form.middle_name')" :rules="'required|alpha_spaces'" :required="true"
                      v-model="middleName" />
                  </div>
                </div>

                <div class="grid col-span-1 sm:grid-cols-6 gap-x-6">
                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.last_name')" :placeholder="t('form.enter_your_last_name')"
                      type="text" :name="t('form.last_name')" :rules="'required|alpha_spaces'" :required="true"
                      v-model="lastName" />
                  </div>

                  <div class="sm:col-span-3">
                    <dynamic-inputs :label="t('form.email')" :placeholder="t('form.enter_your_email')" type="email"
                      name="email" :rules="'required|email'" :required="true" v-model="email" />
                  </div>
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.password')" placeholder="••••••••" type="password" name="password"
                    :rules="'required|minLength:7'" :required="true" v-model="password" />
                </div>

                <div class="mb-6 flex items-start">
                  <div class="flex items-center h-5">
                    <input id="terms" type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" v-model="termsAccepted"
                      name="terms" :value="true" :rules="{ required: true }" />
                  </div>
                  <div class="ms-3 flex flex-col">
                    <label for="terms" class="block text-sm text-slate-500">
                      {{ t('form.accept_terms') }}
                      <nuxt-link to="" class="text-blue-600 hover:underline">
                        {{ t('form.terms_and_conditions') }}
                      </nuxt-link>
                    </label>
                    <span v-if="termsError" class="font-medium text-red-600 block">{{ termsError
                    }}</span>
                  </div>
                </div>
              </ClientOnly>
            </div>

            <!-- base-button component -->
            <div class="mt-7">
              <base-button :default-icon="false" :block="true" type="submit" :disabled="loading" @click="handleSignup">
                <icon name="svg-spinners:270-ring-with-bg" v-if="loading" />
                <span v-else>{{ t('btn.create_account_button') }}</span>
              </base-button>
            </div>

            <!-- Login Link -->
            <div class="mt-6 text-center">
              <p class="text-sm text-slate-500">
                {{ t('form.already_have_account') }}
                <nuxt-link-locale to="/auth/login" class="text-blue-600 font-medium hover:underline ms-1">
                  {{ t('form.login_here') }}
                </nuxt-link-locale>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const authStore = useAuthStore()
const firstName = ref('');
const middleName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const { triggerToast } = useToast();
const { isLoading: loading, startLoading } = useLoading(3000)

const { value: termsAccepted, errorMessage: termsError } = useField<boolean>(
  'terms',
  (value) => {
    if (!value) return t('form.terms_required');
    return true;
  }
);

const handleSignup = async () => {
  if (!email.value || !password.value || !firstName.value || !middleName.value || !lastName.value || !termsAccepted.value) {
    errorMessage.value = t('toast.all_fields_are_required')
    return
  }
  startLoading()
  try {
    await authStore.registerUser(
      email.value,
      password.value,
      firstName.value,
      middleName.value,
      lastName.value
    );
    triggerToast({
      message: t('toast.successfully_signed_up'),
      type: 'success',
      icon: 'mdi-check-circle',
    });
    setTimeout(() => {
      navigateTo('/');
    }, 3000);
    authStore.setWelcomeType('signup');
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_sign_up'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    loading.value = false;
  }
};

definePageMeta({
  layout: 'auth'
});

useHead({
  titleTemplate: () => t('head.sign_up'),
});
</script>