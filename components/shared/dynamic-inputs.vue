<template>
  <div>
    <Form v-slot="{ errors }">
      <label :for="id"
        :class="['block mb-1 text-sm font-medium text-gray-700', errors[name] ? 'text-red-600' : 'text-slate-700']">
        {{ label }}
        <span v-if="required" class="text-red-600">*</span>
      </label>

      <div class="relative w-full">
        <!-- prefix-icon -->
        <span v-if="prefixIcon"
          :class="['absolute inset-y-0 flex items-center text-gray-400 start-3 hover:text-gray-600', errors[name] ? 'text-red-600' : 'text-slate-400']">
          <icon :name="prefixIcon" class="w-5 h-5" />
        </span>
        <!-- input -->
        <template v-if="type === 'textarea'">
          <Field as="textarea" :name="name" :placeholder="placeholder" :id="id" :readonly="readonly"
            v-model="internalValue" :rules="rules"
            class="w-full px-3 py-2 transition duration-300 border rounded-md shadow-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-slate-400 hover:border-slate-300 focus:shadow"
            rows="4" />
        </template>

        <template v-else>
          <Field :type="showPassword ? 'text' : type" :name="name" :placeholder="placeholder" :id="id"
            :readonly="readonly" v-model="internalValue" :rules="rules" :class="[
              'w-full text-sm text-slate-800 px-4 py-3 rounded-md outline-none border focus:border-blue-600',
              errors[name] ? 'border-red-600' : 'border-slate-200'
            ]" />
        </template>

        <!-- Eye icon -->
        <span v-if="type === 'password'" @click="togglePassword"
          class="absolute inset-y-0 flex items-center text-gray-400 cursor-pointer end-3 hover:text-gray-600">
          <icon :name="showPassword ? 'material-symbols:visibility-off-rounded' : 'material-symbols:visibility-rounded'"
            class="w-5 h-5" />
        </span>
      </div>

      <!-- error messages -->
      <div class="mt-1">
        <span class="text-red-500">{{ errors[name] }}</span>
      </div>
    </Form>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    // required: true
  },
  label: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).substr(2, 9)}`
  },
  rules: {
    type: [Object, String],
    default: () => { },
  },
  errors: {
    type: [Object, String],
    default: () => { },
  },
  required: {
    type: Boolean,
    default: false
  },
  prefixIcon: {
    type: String,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Password visibility toggle
const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>