<template>
  <div>
    <div class="border border-gray-300 rounded-lg overflow-hidden">
      <!-- Toolbar -->
      <div class="flex flex-wrap gap-2 bg-gray-100 p-2 border-b">
        <button v-for="btn in buttons" :key="btn.command" :title="btn.label" type="button"
          class="text-gray-700 hover:text-blue-600 p-1" @click="exec(btn.command, btn.value)">
          <icon :name="btn.icon" class="w-5 h-5" />
        </button>
        <button @click="addEmoji" title="Emoji" class="p-1 hover:text-yellow-400 text-gray-700">
          <icon name="twemoji:smiling-face-with-smiling-eyes" class="w-5 h-5" />
        </button>
      </div>

      <!-- Editor area -->
      <div ref="editor" class="min-h-[150px] p-3 outline-none prose prose-sm max-w-none" contenteditable
        @keydown.enter="handleEnter" @input="onEditorInput" @keydown="handleKeyDown"></div>
    </div>

    <!-- Mention dropdown -->
    <div v-if="showMentions"
      class="absolute z-10 mt-1 w-60 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      :style="{ top: `${mentionPosition.top}px`, left: `${mentionPosition.left}px` }">
      <div v-for="(employee, index) in filteredEmployees" :key="employee.id"
        class="relative cursor-pointer select-none py-2 ps-3 pe-9 hover:bg-gray-100"
        :class="{ 'bg-gray-100': index === selectedMentionIndex }" @click="insertMention(employee)">
        <div class="flex items-center">
          <img :src="employee.profileImg || '/dummy-profile-img.jpg'" class="h-6 w-6 rounded-full me-2" />
          <span class="truncate">{{ formatName(employee) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()

const emit = defineEmits(['update:modelValue'])

const editor = ref<HTMLElement | null>(null)

const handleEnter = (e: KeyboardEvent) => {
  e.preventDefault();
  document.execCommand('insertParagraph');
};

const exec = (command: string, value?: string) => {
  if (value !== undefined) {
    document.execCommand(command, false, value)
  } else {
    document.execCommand(command, false)
  }
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
  { command: 'strikeThrough', label: 'Strikethrough', icon: 'mdi:format-strikethrough' },
  { command: 'insertUnorderedList', label: 'Bullet List', icon: 'mdi:format-list-bulleted' },
  { command: 'insertOrderedList', label: 'Numbered List', icon: 'mdi:format-list-numbered' },
  { command: 'justifyLeft', label: 'Align Left', icon: 'mdi:format-align-left' },
  { command: 'justifyCenter', label: 'Align Center', icon: 'mdi:format-align-center' },
  { command: 'justifyRight', label: 'Align Right', icon: 'mdi:format-align-right' },
  { command: 'removeFormat', label: 'Clear Formatting', icon: 'mdi:format-clear' }
]

const addEmoji = () => {
  const el = editor.value;
  if (!el) return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode('😊'));
  // Move caret after emoji
  range.setStartAfter(range.endContainer);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

const employeesStore = useEmployeesStore();
const showMentions = ref(false);
const mentionQuery = ref('');
const selectedMentionIndex = ref(0);
const mentionPosition = ref({ top: 0, left: 0 });
const lastAtPosition = ref(0);

const handleKeyDown = (e: KeyboardEvent) => {
  if (showMentions.value) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedMentionIndex.value = Math.min(
          selectedMentionIndex.value + 1,
          filteredEmployees.value.length - 1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredEmployees.value[selectedMentionIndex.value]) {
          insertMention(filteredEmployees.value[selectedMentionIndex.value]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        showMentions.value = false;
        break;
      default:
        // Allow normal typing to continue
        break;
    }
  } else if (e.key === '@') {
    // Trigger mention detection on next tick
    nextTick(checkForMentions);
  }
};

const checkForMentions = () => {
  if (!editor.value) return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  const text = node.textContent || '';
  const offset = range.startOffset;
  // Find the last '@' symbol before the cursor
  const textBeforeCursor = text.substring(0, offset);
  const atIndex = textBeforeCursor.lastIndexOf('@');
  if (atIndex !== -1 && (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1]))) {
    mentionQuery.value = textBeforeCursor.substring(atIndex + 1);
    lastAtPosition.value = atIndex;
    // Get cursor position
    const rangeClone = range.cloneRange();
    rangeClone.setStart(node, atIndex);
    rangeClone.setEnd(node, atIndex);
    const rect = rangeClone.getBoundingClientRect();
    if (editor.value) {
      const editorRect = editor.value.getBoundingClientRect();
      mentionPosition.value = {
        top: rect.top - editorRect.top + 25,
        left: rect.left - editorRect.left
      };
    }
    showMentions.value = true;
    selectedMentionIndex.value = 0;
  } else {
    showMentions.value = false;
  }
};

const allEmployees = computed(() => {
  return employeesStore.allUsers.filter(e => e.status === 'active');
});

const filteredEmployees = computed(() => {
  if (!mentionQuery.value) return allEmployees.value;
  const query = mentionQuery.value.toLowerCase();
  return allEmployees.value.filter(employee => {
    const name = formatName(employee).toLowerCase();
    return name.includes(query);
  });
});

const formatName = (user: any) => {
  if (!user) return "";
  const parts = [];
  if (user.firstName) parts.push(user.firstName);
  if (user.lastName) parts.push(user.lastName);
  return parts.join(" ");
};

const insertMention = (employee: any) => {
  if (!editor.value) return;
  const name = formatName(employee);
  const mentionHtml = `<span contenteditable="false" class="font-semibold text-blue-500">${name}</span>&nbsp;`;
  document.execCommand('insertHTML', false, mentionHtml);
  emit('update:modelValue', editor.value.innerHTML);
  showMentions.value = false;
};

onMounted(() => {
  if (editor.value) {
    editor.value.innerHTML = props.modelValue || '';
  }
});

watch(() => props.modelValue, (newVal) => {
  if (editor.value && editor.value.innerHTML !== newVal) {
    editor.value.innerHTML = newVal;
  }
});

const onEditorInput = () => {
  if (editor.value) {
    emit('update:modelValue', editor.value.innerHTML);
  }
  checkForMentions();
};
</script>

<style scoped>
.prose:focus {
  outline: none;
}
</style>