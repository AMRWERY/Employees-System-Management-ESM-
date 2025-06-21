<template>
  <div>
    <div id="task-modal" v-if="visible">
      <div
        class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1">
              {{ task ? t('dashboard.edit_task') : t('dashboard.add_task') }}
            </h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="$emit('close')" />
          </div>

          <div class="my-6">
            <ClientOnly>
              <div class="grid col-span-1 sm:grid-cols-6 gap-x-6 space-y-6">
                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.title')" :placeholder="t('form.enter_task_title')" type="text"
                    :name="t('form.title')" :rules="'required|alpha_spaces'" :required="true" v-model="title" />
                </div>

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.description')" :placeholder="t('form.enter_task_desc_here')"
                    type="textarea" :name="t('form.description')" :rules="'required'" :required="true"
                    v-model="description" />
                </div>

                <!-- <div class="col-span-full">
                  <dynamic-inputs :label="t('form.assign_to')" type="select" :options="assiginOptions"
                    :name="t('form.assign_to')" :rules="'required'" :required="true" />
                </div> -->

                <div class="col-span-full">
                  <dynamic-inputs :label="t('form.priority')" type="select" :options="priorityOptions"
                    :name="t('form.priority')" :rules="'required'" :required="true"
                    :placeholder="t('form.select_priority')" v-model="priority" />
                </div>
              </div>
            </ClientOnly>
          </div>

          <div class="border-t border-gray-300 pt-6 flex justify-end gap-4">
            <base-button :default-icon="false" type="submit" :disabled="loading" @click="handleSubmit">
              <icon name="svg-spinners:90-ring-with-bg" v-if="loading" />
              <span v-else>{{ task ? t('btn.update') : t('btn.add') }}</span>
            </base-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Task, Priority } from '@/types/task-management'

const { t } = useI18n()
const taskStore = useTaskManagementStore()
const { triggerToast } = useToast()
const { isLoading: loading, startLoading } = useLoading(3000)

const { task, visible } = defineProps<{
  task?: Task | null
  visible: boolean
}>()

const emit = defineEmits(['close', 'submit'])

// const assiginOptions = ref([])

const priorities: Priority[] = ['high', 'medium', 'low']

const priorityOptions = computed(() =>
  priorities.map(p => ({
    label: t(`priorities.${p}`),
    value: p
  }))
)

const title = ref('')
const description = ref('')
const priority = ref<Priority | ''>('')

const handleSubmit = async () => {
  const authStore = useAuthStore()
  if (!authStore.user) return
  try {
    startLoading()
    loading.value = true;
    const formData: Omit<Task, 'id'> = {
      title: title.value,
      description: description.value,
      priority: priority.value as Priority,
      status: task?.status || 'todo',
      elapsedTime: task?.elapsedTime ?? 0,
      userId: authStore.user.uid
    }
    if (task) {
      // Update
      await taskStore.updateTask(task.id, formData)
      triggerToast({
        message: t('toast.task_updated_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      })
    } else {
      // Add
      await taskStore.addTask(formData)
      triggerToast({
        message: t('toast.task_added_successfully'),
        type: 'success',
        icon: 'mdi-check-circle',
      })
      resetForm()
    }
    setTimeout(() => {
      emit('submit')
      emit('close')
    }, 3000)
  } catch {
    triggerToast({
      message: task
        ? t('toast.failed_to_task_update')
        : t('toast.failed_to_task_add'),
      type: 'error',
      icon: 'mdi-alert-circle',
    })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  title.value = ''
  description.value = ''
  priority.value = ''
}

watch(
  () => task,
  (val) => {
    if (val) {
      title.value = val.title
      description.value = val.description
      priority.value = (val.priority ?? '') as Priority | ''
    }
  },
  { immediate: true }
)
</script>