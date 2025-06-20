<template>
    <div>
        <!-- task-details component -->
        <task-details v-if="isModalOpen" :task="selectedTask" @close="closeModal" @update-status="updateTaskStatus"
            @update-time="updateTaskTime" @edit-task="handleEditFromDetails" />

        <div>
            <div class="flex items-center justify-between my-6 flex-nowrap">
                <h1 class="text-2xl font-bold mb-6">{{ t('dashboard.tasks_board') }}</h1>
                <div class="flex items-center justify-center gap-4 ms-auto">

                    <!-- base-button component -->
                    <base-button :default-icon="false" @click="openAddDialog">
                        {{ t('btn.add_task') }}
                    </base-button>

                    <!-- add-edit-task component -->
                    <add-edit-task :visible="showAddDialog" :task="taskToEdit" @close="closeAddDialog"
                        @submit="handleTaskSubmit" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-gray-200 border p-4 rounded-lg">
                <div v-for="status in statuses" :key="status" class="bg-white rounded p-2 shadow-lg">
                    <h2 class="text-lg font-semibold mb-4 text-center border-b pb-3">{{ statusLabels[status] }}</h2>
                    <div class="h-[400px] overflow-y-auto hide-scrollbar" :data-status="status" @dragover.prevent
                        @drop="handleDrop($event, status)">
                        <transition-group name="task" tag="ul" class="space-y-3" appear>
                            <li v-for="(task, index) in tasksByStatus(status)" :key="task.id" :data-index="index"
                                class="flex items-center hover:bg-gray-50 transition bg-blue-50 p-3 rounded shadow cursor-grab"
                                draggable="true" @dragstart="handleDragStart($event, task)"
                                @dragover.prevent="handleDragOver(index)" @dragleave="handleDragLeave"
                                @click="openModal(task)">
                                <!-- Task content -->
                                <div
                                    class="flex-shrink-0 w-11 h-11 bg-blue-200 rounded-full flex items-center justify-center">
                                    <span class="text-sm text-blue-600 font-bold">{{ index + 1 }}</span>
                                </div>
                                <div class="ms-4 flex-grow">
                                    <div class="text-[15px] font-medium text-slate-900">{{ task.title }}</div>
                                    <div class="text-[13px] text-slate-500">{{ task.description }}</div>
                                </div>
                                <div class="flex items-center space-s-2">
                                    <span
                                        class="bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded-full">{{
                                            task.status
                                        }}</span>
                                </div>
                            </li>
                        </transition-group>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { Status, Task } from '@/types/task-management'

const { t } = useI18n()
const taskStore = useTaskManagementStore()

onMounted(() => {
    taskStore.fetchTasks()
})

const statuses: Status[] = ['todo', 'in-progress', 'done']

const statusLabels: Record<Status, string> = {
    'todo': t('status.todo'),
    'in-progress': t('status.in-progress'),
    'done': t('status.done')
}

const tasks = computed(() => taskStore.tasks)

const draggedTask = ref<Task | null>(null)
const dragOverIndex = ref<number | null>(null)

const handleDragStart = (e: DragEvent, task: Task) => {
    draggedTask.value = task
    e.dataTransfer?.setData('text/plain', String(task.id))
}

const handleDrop = (e: DragEvent, newStatus: Status) => {
    e.preventDefault()
    if (!draggedTask.value) return
    const index = dragOverIndex.value
    const draggedId = draggedTask.value.id
    // Remove dragged task
    const currentIndex = tasks.value.findIndex(t => t.id === draggedId)
    const [movedTask] = tasks.value.splice(currentIndex, 1)
    // Update status if needed
    movedTask.status = newStatus
    // Filter tasks in this column
    const tasksInColumn = tasksByStatus(newStatus)
    // Find actual index among global tasks
    const beforeTask = index != null ? tasksInColumn[index] : null
    const insertIndex = beforeTask
        ? tasks.value.findIndex(t => t.id === beforeTask.id)
        : tasks.value.length
    // Insert at new index
    tasks.value.splice(insertIndex, 0, movedTask)
    taskStore.updateTask(movedTask.id, { status: newStatus })
    // Cleanup
    draggedTask.value = null
    dragOverIndex.value = null
}

const handleDragOver = (index: number) => {
    dragOverIndex.value = index
}

const handleDragLeave = () => {
    dragOverIndex.value = null
}

const tasksByStatus = (status: Status): Task[] => {
    return tasks.value.filter(task => task.status === status)
}

const selectedTask = ref<Task | null>(null)
const isModalOpen = ref(false)

const openModal = (task: Task) => {
    selectedTask.value = task
    isModalOpen.value = true
}

const closeModal = () => {
    selectedTask.value = null
    isModalOpen.value = false
}

const updateTaskStatus = ({ id, status }: { id: string; status: Status }) => {
    taskStore.updateTask(id, { status })
    closeModal()
}

const updateTaskTime = ({ id, elapsedTime }: { id: string; elapsedTime: number }) => {
    taskStore.updateTaskElapsedTime(id, elapsedTime)
}

const showAddDialog = ref(false);
const taskToEdit = ref<Task | null>(null)

const openAddDialog = () => {
    taskToEdit.value = null
    showAddDialog.value = true
}

const openEditDialog = (task: Task) => {
    taskToEdit.value = { ...task }
    showAddDialog.value = true
}

const closeAddDialog = () => {
    showAddDialog.value = false
    taskToEdit.value = null
}

const handleTaskSubmit = async (newTask: Task) => {
    const authStore = useAuthStore()
    const exists = taskStore.tasks.find(t => t.id === newTask.id)
    if (exists) {
        await taskStore.updateTask(newTask.id, newTask)
    } else {
        if (!authStore.user) return
        await taskStore.addTask({
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            status: newTask.status,
            elapsedTime: newTask.elapsedTime,
            userId: authStore.user.uid
        })
    }
    closeAddDialog()
}

const handleEditFromDetails = (task: Task) => {
    isModalOpen.value = false
    openEditDialog(task)
}

useHead({
    titleTemplate: () => t('head.task_management'),
});
</script>

<style scoped>
[draggable="true"] {
    user-select: none;
}

/* Vue transition-group animation */
.task-move {
    transition: all 0.3s ease;
}

.task-enter-active,
.task-leave-active {
    transition: all 0.25s ease;
}

.task-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.task-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>