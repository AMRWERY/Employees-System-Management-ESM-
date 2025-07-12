<template>
  <div>
    <div class="relative inline-block group" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
      <!-- Slot for any element -->
      <slot />

      <!-- Tooltip -->
      <Transition name="fade">
        <div v-show="showTooltip"
          class="absolute z-50 px-3 whitespace-nowrap py-1.5 text-sm text-white transition-all duration-300 rounded-lg shadow-md"
          :class="tooltipClasses" ref="tooltip">
          {{ text }}
          <div class="absolute w-2 h-2 rotate-45" :class="arrowClasses"></div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  color?: string
}>()

const position = props.position ?? 'top'
const color = props.color ?? 'bg-gray-800'

const showTooltip = ref(false)

// Tooltip position classes
const tooltipClasses = computed(() => ({
  'top-[-40px] left-1/2 -translate-x-1/2': position === 'top',
  'top-[30px] left-1/2 -translate-x-1/2': position === 'bottom',
  'left-[-100%] top-1/2 -translate-y-1/2': position === 'left',
  'right-[-100%] top-1/2 -translate-y-1/2': position === 'right',
  [color]: true,
}))

// Arrow position classes
const arrowClasses = computed(() => ({
  'bottom-[-4px] left-1/2 -translate-x-1/2': position === 'top',
  'top-[-4px] left-1/2 -translate-x-1/2': position === 'bottom',
  'right-[-4px] top-1/2 -translate-y-1/2': position === 'left',
  'left-[-4px] top-1/2 -translate-y-1/2': position === 'right',
  [color]: true,
}))
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>