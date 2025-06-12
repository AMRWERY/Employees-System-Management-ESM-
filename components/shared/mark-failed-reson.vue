<template>
  <div>
    <div v-if="modelValue">
      <div
        class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-md bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ t('dashboard.mark_as_failed_title') }}</h3>
            <button @click="closeDialog" type="button" class="ms-2 outline-none">
              <icon name="material-symbols:close-small-rounded"
                class="w-7 h-7 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" />
            </button>
          </div>

          <div class="my-6">
            <dynamic-inputs :label="t('form.failure_reason')" :placeholder="t('form.enter_failure_reason_placeholder')"
              type="textarea" :name="t('form.failure_reason')" :rules="'required'" :required="true"
              v-model="internalReason" />
          </div>

          <div class="border-t border-gray-300 pt-6 flex justify-end gap-4">
            <base-button @click="confirmAction" :disabled="loading" :default-icon="false" type="submit">
              {{ confirmText }}
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  initialReason: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: 'Submit',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'close']);

const internalReason = ref('');

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    internalReason.value = props.initialReason || '';
  }
});

watch(() => props.initialReason, (newVal) => {
  if (props.modelValue) {
    internalReason.value = newVal || '';
  }
});

const closeDialog = () => {
  emit('update:modelValue', false);
  emit('close');
};

const confirmAction = () => {
  emit('confirm', internalReason.value);
};
</script>