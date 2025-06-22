<template>
  <div>
    <div class="border border-gray-300 rounded-lg overflow-hidden">
      <!-- Toolbar -->
      <div class="flex flex-wrap gap-2 bg-gray-100 p-2 border-b">
        <button v-for="btn in buttons" :key="btn.command" :title="btn.label" type="button"
          class="text-gray-700 hover:text-blue-600 p-1" @click="exec(btn.command, btn.value)">
          <icon :name="btn.icon" class="w-5 h-5" />
        </button>
      </div>

      <!-- Editor area -->
      <div ref="editor" class="min-h-[150px] p-3 outline-none prose prose-sm max-w-none" contenteditable
        @input="updateContent" v-html="modelValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
}>()

const emit = defineEmits(['update:modelValue'])

const editor = ref<HTMLElement | null>(null)

const updateContent = () => {
  if (editor.value) {
    emit('update:modelValue', editor.value.innerHTML)
  }
}

const exec = (command: string, value?: string) => {
  if (value !== undefined) {
    document.execCommand(command, false, value)
  } else {
    document.execCommand(command, false)
  }
  updateContent()
}

type Button = {
  command: string;
  label: string;
  icon: string;
  value?: string;
}

const buttons: Button[] = [
  { command: 'bold', label: 'Bold', icon: 'mdi:format-bold' },
  { command: 'italic', label: 'Italic', icon: 'mdi:format-italic' },
  { command: 'underline', label: 'Underline', icon: 'mdi:format-underline' },
  { command: 'insertUnorderedList', label: 'Bullet List', icon: 'mdi:format-list-bulleted' },
  { command: 'insertOrderedList', label: 'Numbered List', icon: 'mdi:format-list-numbered' },
  { command: 'removeFormat', label: 'Clear Formatting', icon: 'mdi:format-clear' }
]
</script>

<style scoped>
/* Optional: Tailwind Typography plugin gives `.prose` styles */
.prose:focus {
  outline: none;
}
</style>