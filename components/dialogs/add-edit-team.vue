<template>
  <div>
    <dynamic-dialog id="add-team-modal" v-model="visibleProxy" :dialogHeight="'calc(345px - 88px)'"
      :title="isEditing ? t('dashboard.edit_team') : t('dashboard.add_team')" :data="{ newTeam, isSaving, isEditing }"
      @close="emit('update:modelValue', false)">
      <template #default>
        <div class="my-3">
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
      </template>
      <template #footer>
        <base-button :default-icon="false" type="submit" @click="handleSave" :loading="isSaving">
          <icon name="svg-spinners:90-ring-with-bg" v-if="isSaving" />
          <span v-else>{{ isEditing ? t('btn.save_changes') : t('btn.add') }}</span>
        </base-button>
      </template>
    </dynamic-dialog>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const teamStore = useTeamStore();
const { triggerToast } = useToast()
const { isLoading: isSaving, startLoading } = useLoading(3000)

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  teamData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const isEditing = computed(() => !!props.teamData)

const visibleProxy = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) emit('update:modelValue', false)
  }
})

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

watch(
  [() => props.modelValue, () => props.teamData],
  ([newVal, newTeamData]) => {
    if (newVal) {
      if (newTeamData) {
        newTeam.value = {
          name: newTeamData.name || '',
          description: newTeamData.description || '',
        }
      } else {
        resetForm();
      }
    }
    if (!newVal) resetForm();
  },
  { immediate: true }
)

const handleSave = async () => {
  try {
    startLoading()
    if (isEditing.value && props.teamData && props.teamData.id) {
      await teamStore.updateTeam(props.teamData.id, {
        name: newTeam.value.name,
        description: newTeam.value.description,
      });
      emit('save', { ...newTeam.value, id: props.teamData.id })
      triggerToast({
        message: t('toast.team_updated_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      })
    } else {
      await teamStore.createTeam({
        name: newTeam.value.name,
        description: newTeam.value.description,
      });
      emit('save')
      triggerToast({
        message: t('toast.team_added_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      })
    }
    emit('update:modelValue', false)
    resetForm();
  } catch (error) {
    triggerToast({
      message: isEditing.value ? t('toast.failed_to_update_team') : t('toast.failed_to_add_team'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    isSaving.value = false;
  }
}
</script>