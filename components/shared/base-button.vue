<template>
  <div>
    <button :class="buttonClasses" :title="title" :type="type">
      <slot></slot>
      <slot name="icon">
        <icon v-if="defaultIcon" name="heroicons-solid:plus-sm" class="ms-2 w-5 h-5" />
        <icon v-else-if="appendIcon" :name="appendIcon" class="ms-2 w-5 h-5" />
      </slot>
    </button>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  type: {
    type: String as PropType<'button' | 'submit' | 'reset'>,
    default: 'button',
  },
  defaultIcon: {
    type: Boolean,
    default: true
  },
  appendIcon: {
    type: String,
    default: '',
  },
  block: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'title'
  },
  bgColor: {
    type: String,
    default: 'base-btn-bg'
    // default: 'bg-[#3b5998]'
  },
  hoverColor: {
    type: String,
    default: 'hover:bg-[#3b5998]/90'
  },
  borderColor: {
    type: String,
    default: 'border-current'
  },
  textColor: {
    type: String,
    default: 'text-current'
  },
  noBorder: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'solid', // options: 'solid' | 'outline'
    validator: (val: string) => ['solid', 'outline'].includes(val)
  },
  link: {
    type: Boolean,
    default: false
  },
});

const buttonClasses = computed(() => {
  if (props.link) {
    return [
      'font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center',
      'text-blue-600 dark:text-blue-500 hover:underline',
      props.block ? 'w-full' : ''
    ]
  }

  const base = ['font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center']

  const block = props.block ? 'w-full' : ''

  const variantClass =
    props.variant === 'outline'
      ? [!props.noBorder ? 'border' : '', props.borderColor, props.textColor, 'bg-transparent']
      : ['text-white', props.bgColor, props.hoverColor]

  return [...base, block, ...variantClass]
})
</script>