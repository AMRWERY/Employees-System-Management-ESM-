<template>
  <div>
    <div class="relative w-full" :class="containerClass">
      <input type="text" :value="modelValue" @input="onInput"
        @keydown.enter="$emit('search', ($event.target as HTMLInputElement).value)"
        :placeholder="placeholder || t('form.search_placeholder')" class="w-full px-4 py-2 border rounded-lg pe-10"
        aria-label="Search" />
      <div class="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
        <icon name="heroicons-solid:magnifying-glass" class="w-5 h-5 text-gray-400" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const props = defineProps<{
  modelValue: string; // For v-model
  placeholder?: string;
  containerClass?: string | string[] | Record<string, boolean>; // Optional class for the container div
  debounce?: number; // Optional debounce time in ms
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void; // Emitted on enter or after debounce
}>();

let debounceTimer: number | undefined;

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);

  if (props.debounce && props.debounce > 0) {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      emit('search', target.value);
    }, props.debounce);
  } else if (!props.debounce) { // If no debounce, emit search immediately
    emit('search', target.value);
  }
};
</script>