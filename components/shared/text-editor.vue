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
        @input="updateContent" @keydown.enter="handleEnter" v-html="modelValue" />
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
    // Process each paragraph separately
    const paragraphs = editor.value.querySelectorAll('p, div') as NodeListOf<HTMLElement>;
    paragraphs.forEach(p => {
      const text = p.innerText.trim();
      if (!text) return;
      // Remove existing direction attributes
      p.removeAttribute('dir');
      p.removeAttribute('style');
      // Set direction per paragraph
      const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
      p.style.textAlign = rtlChars.test(text) ? 'right' : 'left';
      p.style.unicodeBidi = 'plaintext';
    });
    emit('update:modelValue', editor.value.innerHTML);
  }
};

const handleEnter = (e: KeyboardEvent) => {
  e.preventDefault();
  document.execCommand('insertParagraph');
  nextTick(updateContent);
};

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
  updateContent();
};
</script>

<style scoped>
.prose:focus {
  outline: none;
}
</style>