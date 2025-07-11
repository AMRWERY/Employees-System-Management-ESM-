<template>
  <div>
    <ul class="flex gap-5 w-max bg-gray-100 p-1 rounded-full mx-auto">
      <transition-group name="tab-change" tag="div" class="flex gap-5">
        <li v-for="tab in tabs" :key="tab.id" @click="$emit('update:activeTab', tab.id)" :class="[
          'tab font-semibold w-full text-center text-[15px] py-2.5 px-5 tracking-wide rounded-full cursor-pointer transition-all duration-300 max-w-fit',
          activeTab === tab.id
            ? 'bg-blue-600 text-white'
            : 'text-slate-600 border border-blue-600 hover:bg-blue-400 hover:text-white'
        ]">
          {{ tab.label }}
        </li>
      </transition-group>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { Tab } from '@/types/tabs'

defineProps<{
  tabs: Tab[]
  activeTab: Tab["id"]
}>()

defineEmits<{
  (e: 'update:activeTab', value: Tab["id"]): void
}>()
</script>


<style scoped>
.tab-change-enter-active,
.tab-change-leave-active {
  transition: all 0.3s ease;
}

.tab-change-enter-from,
.tab-change-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Content transition */
.fade-slide-enter-active {
  transition: all 0.3s ease-out;
}

.fade-slide-leave-active {
  transition: all 0.2s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.tab {
  position: relative;
  overflow: hidden;
}

.tab[class*='bg-blue-600']::after {
  transform: scaleX(1);
}
</style>