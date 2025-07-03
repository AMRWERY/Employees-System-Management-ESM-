<template>
  <div>
    <teleport to="body">
      <div :id="id" v-if="modelValue"
        class="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
          <div class="flex items-center pb-3 border-b border-gray-300">
            <h3 class="text-slate-900 text-xl font-semibold flex-1 capitalize">
              {{ title }}
            </h3>
            <icon name="material-symbols:close-small-rounded"
              class="ms-2 cursor-pointer shrink-0 text-gray-400 hover:text-gray-500" @click="closeDialog" />
          </div>

          <div class="my-3 overflow-y-auto hide-scrollbar" :style="contentStyle">
            <slot :data="data"></slot>
          </div>

          <div class="border-t border-gray-300 pt-3 flex justify-end gap-4">
            <slot name="footer" :close="closeDialog"></slot>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  id: {
    type: String,
    default: ''
  },
  modelValue: { // Controls visibility using v-model
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  data: { // Data to pass down to the slotted content
    type: Object,
    default: () => ({})
  },
  dialogHeight: {
    type: String,
    default: 'calc(500px - 88px)'
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const closeDialog = () => {
  emit('update:modelValue', false); // Update v-model to hide
  emit('close'); // Emit a separate close event if needed for additional logic
};

const contentStyle = computed(() => ({
  height: props.dialogHeight
}));
</script>