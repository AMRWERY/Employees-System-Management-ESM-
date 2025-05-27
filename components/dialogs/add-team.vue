<template>
  <div>
    <div v-if="modelValue" id="add-team-modal">
      <div @click.self="$emit('update:modelValue', false)"
        class="fixed inset-0 p-4 flex flex-wrap justify-end items-end w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">{{ t('dashboard.add_team') }}</h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500"
              @click="$emit('update:modelValue', false)" />
          </div>

          <div class="my-3 overflow-y-auto h-[calc(320px-88px)]">
            <ClientOnly>
              <div class="grid col-span-1 sm:grid-cols-6 gap-x-6 space-y-2">
                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.department_name')" :placeholder="t('form.enter_department_name')"
                    type="text" :name="t('form.department_name')" :rules="'required'" :required="true"
                    v-model="newTeam.name" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.description')" :placeholder="t('form.enter_description')"
                    type="textarea" :name="t('form.description')" :rules="'required'" :required="true"
                    v-model="newTeam.description" />
                </div>
              </div>
            </ClientOnly>
          </div>

          <div class="border-t border-gray-300 pt-3 flex justify-end gap-4">
            <!-- base-button component -->
            <base-button :default-icon="false" type="submit" @click="handleSave" :loading="isSaving">
              <icon name="svg-spinners:90-ring-with-bg" v-if="isSaving" />
              <span v-else>{{ t('btn.add') }}</span>
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const teamStore = useTeamStore();
const { triggerToast } = useToast()

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const isSaving = ref(false);

const newTeam = ref({
  name: '',
  description: '',
});

const resetForm = () => {
  newTeam.value = {
    name: '',
    description: '',
  };
};

const handleSave = async () => {
  try {
    isSaving.value = true;
    const startTime = Date.now();
    await teamStore.createTeam({
      name: newTeam.value.name,
      description: newTeam.value.description,
    });
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(3000 - elapsed, 0);
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
    emit('save');
    emit('update:modelValue', false);
    triggerToast({
      message: t('toast.team_added_successfully'),
      type: 'success',
      icon: 'mdi-check-circle',
    })
    resetForm();
  } catch (error) {
    triggerToast({
      message: t('toast.failed_to_add_team'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    isSaving.value = false;
  }
};
</script>