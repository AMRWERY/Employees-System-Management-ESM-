<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <div class="relative w-full">
      <button type="button" ref="toggleButton" @click.stop="open = !open"
        class="px-5 py-2.5 border border-gray-300 text-slate-900 text-sm font-medium outline-none bg-white hover:bg-gray-50 flex items-center justify-between min-w-[190px] w-full">
        <span>{{ currentLabel }}</span>
        <icon name="ic:sharp-keyboard-arrow-down" class="w-5 text-gray-500 ms-3 transition-transform"
          :class="{ 'rotate-180': open }" />
      </button>

      <ul ref="dropdownMenu"
        class="absolute shadow-[0_8px_19px_-7px_rgba(6,81,237,0.2)] bg-white py-2 z-[1000] max-h-96 overflow-auto w-full"
        :class="{ hidden: !open, block: open }">
        <li v-for="option in options" :key="option.value" @click="selectOption(option)"
          class="dropdown-item py-3 px-5 hover:bg-gray-50 text-slate-900 text-sm font-medium cursor-pointer flex items-center gap-2">
          {{ option.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SelectOption } from '@/types/payroll'

const props = defineProps({
  options: {
    type: Array as () => SelectOption[],
    required: true,
  },
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Select an option",
  },
  label: {
    type: String,
    default: "",
  }
});

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);

const currentLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue);
  return option ? option.label : props.placeholder;
});

const selectOption = (option: SelectOption) => {
  emit("update:modelValue", option.value);
  open.value = false;
};
</script>