<template>
  <div>
    <div class="flex items-center justify-center min-h-screen p-6">
      <div id="content" role="main" class="w-full max-w-md">
        <div class="mt-7 bg-white rounded-xl shadow-lg border-2 border-indigo-300">
          <div class="p-4 sm:p-7">
            <div class="text-center">
              <h1 class="block text-2xl font-bold text-gray-800">{{ t('form.forgot_password') }}</h1>
            </div>

            <div class="mt-5">
              <div class="grid gap-y-4">
                <div>
                  <dynamic-inputs :label="t('form.email')" :placeholder="t('form.enter_your_email')" type="email"
                    name="email" :rules="'required|email'" :required="true" v-model="email" />
                </div>

                <!-- base-button component -->
                <base-button :default-icon="false" :block="true" type="submit" :disabled="loading"
                  @click="handleResetPassword">
                  <icon name="svg-spinners:270-ring-with-bg" v-if="loading" />
                  <span v-else>{{ t('btn.reset_password') }}</span>
                </base-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const email = ref('');
const loading = ref(false);

const handleResetPassword = () => {
  console.log('reset password')
}

definePageMeta({
  layout: 'auth'
});

useHead({
  titleTemplate: () => t('head.reset_password'),
});
</script>