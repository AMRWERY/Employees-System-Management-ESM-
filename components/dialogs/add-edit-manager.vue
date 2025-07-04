<template>
  <div>
    <dynamic-dialog id="add-edit-manager-modal" v-model="visibleProxy" :dialogHeight="'calc(408px - 88px)'"
      :title="isEditing ? t('dashboard.edit_manager') : t('dashboard.add_manager')"
      :data="{ formValues, loading, isEditing, selectedTeam, teams: teamsStore.teams }"
      @close="emit('update:modelValue', false)">
      <template #default>
        <div class="my-3">
          <ClientOnly>
            <div class="grid col-span-1 sm:grid-cols-6 gap-x-6 space-y-2">
              <div class="col-span-full">
                <dynamic-inputs :label="t('form.first_name')" :placeholder="t('form.enter_first_name')" type="text"
                  :name="t('form.first_name')" :rules="'required|alpha_spaces'" :required="true"
                  v-model="formValues.firstName" />
              </div>
              <div class="col-span-full">
                <dynamic-inputs :label="t('form.last_name')" :placeholder="t('form.enter_last_name')" type="text"
                  :name="t('form.last_name')" :rules="'required|alpha_spaces'" :required="true"
                  v-model="formValues.lastName" />
              </div>
              <div class="col-span-full">
                <dynamic-inputs :label="t('form.email')" :placeholder="t('form.enter_email')" type="email"
                  :name="t('form.email')" :rules="'required|email'" :required="true" v-model="formValues.email" />
              </div>
              <div class="col-span-full">
                <dynamic-inputs :label="t('form.password')" :placeholder="t('form.enter_password')" type="password"
                  :name="t('form.password')" :rules="isEditing ? '' : 'required|minLength:7'" :required="!isEditing"
                  v-model="formValues.password" />
              </div>
              <div class="col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('form.teams') }}</label>
                <select v-model="selectedTeam"
                  class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow">
                  <option value="" disabled>{{ t('form.select_team') }}</option>
                  <option v-for="team in teamsStore.teams" :key="team.id" :value="team.id">
                    {{ getTeamName(team.id, team.name) }}
                  </option>
                </select>
              </div>
            </div>
          </ClientOnly>
        </div>
      </template>
      <template #footer>
        <base-button :default-icon="false" type="submit" :loading="loading" @click="handleSave">
          <icon name="svg-spinners:90-ring-with-bg" v-if="loading" />
          <span v-else>{{ isEditing ? t('btn.save_changes') : t('btn.add') }}</span>
        </base-button>
      </template>
    </dynamic-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { Manager } from '@/types/managers'

const { t } = useI18n();
const { triggerToast } = useToast();
const { getTeamName } = useTeamName();
const { isLoading: loading, startLoading } = useLoading(3000);
const managerStore = useManagerStore();
const teamsStore = useTeamStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  managerData: {
    type: Object as PropType<Manager | null>,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const isEditing = computed(() => !!props.managerData);

const visibleProxy = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) emit('update:modelValue', false);
  }
});

const selectedTeam = ref('');

const formValues = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  position: '',
});

const resetForm = () => {
  formValues.firstName = '';
  formValues.lastName = '';
  formValues.email = '';
  formValues.password = '';
  formValues.position = '';
  selectedTeam.value = '';
};

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});

watch(() => props.managerData, (newManagerData) => {
  if (newManagerData) {
    // Update form values for edit mode
    Object.assign(formValues, {
      firstName: newManagerData.firstName || '',
      lastName: newManagerData.lastName || '',
      email: newManagerData.email || '',
      position: newManagerData.position || '',
    });
    selectedTeam.value = newManagerData.teamId || '';
  } else {
    // Reset for add mode
    resetForm();
  }
}, { immediate: true });

const handleSave = async () => {
  try {
    startLoading();
    if (isEditing.value && props.managerData && props.managerData.id) {
      await managerStore.updateManager(props.managerData.id, {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        position: formValues.position,
        teamId: selectedTeam.value,
        // password: formValues.password, // Only if password is changed
      });
      emit('save', { ...formValues, id: props.managerData.id });
      triggerToast({
        message: t('toast.manager_updated_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      });
    } else {
      await managerStore.createManager({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        password: formValues.password,
        position: formValues.position,
        teamId: selectedTeam.value,
      });
      emit('save');
      triggerToast({
        message: t('toast.manager_added_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      });
    }
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    triggerToast({
      message: isEditing.value ? t('toast.failed_to_update_manager') : t('toast.failed_to_add_manager'),
      type: 'error',
      icon: 'material-symbols:error-outline-rounded',
    });
  } finally {
    loading.value = false;
  }
};
</script>