<template>
    <div>
        <transition name="bounce" mode="out-in">
            <div v-if="visible"
                :class="`relative w-full max-w-lg p-5 rounded-lg shadow-xl sm:max-w-lg z-50 border-s-4 ${toastStyles}`"
                role="alert">
                <!-- Progress bar container -->
                <div class="absolute bottom-0 w-full h-1 bg-white rounded-b-lg start-0 bg-opacity-20">
                    <div class="h-full transition-all ease-linear" :class="progressBarColor"
                        :style="progressBarStyle" />
                </div>
                <icon :name="toastIcon" :class="`${iconColor}`"
                    class="inline p-0.5 shrink-0 me-3 rounded-full items-center justify-center" width="20"
                    height="20" />
                <span class="block text-lg me-3 sm:inline" :class="textColor">{{ message }}</span>
                <icon name="material-symbols:close-small-rounded" class="inline cursor-pointer ms-auto shrink-0"
                    width="24" height="24" @click="closeToast" />
            </div>
        </transition>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps({
    message: {
        type: String,
        required: true,
    },
    toastIcon: {
        type: String,
        default: '',
    },
    toastType: {
        type: String,
        default: '',
    },
    duration: {
        type: Number,
        default: 5000,
    },
});

const visible = ref(true);
const progressWidth = ref(100);
const emit = defineEmits(['toastClosed']);

const toastStyles = computed(() => {
    switch (props.toastType) {
        case 'success':
            return 'bg-green-100 border-green-700 text-green-500 font-semibold tracking-wide flex items-center w-max max-w-sm p-4 rounded-md shadow-md shadow-green-200';
        case 'error':
            return 'bg-red-100 border-red-700 text-red-500 font-semibold tracking-wide flex items-center w-max max-w-sm p-4 rounded-md shadow-md shadow-red-200';
        case 'warning':
            return 'bg-yellow-100 border-yellow-700 text-yellow-500 font-semibold tracking-wide flex items-center w-max max-w-sm p-4 rounded-md shadow-md shadow-yellow-200';
        default:
            return 'bg-blue-100 border-blue-700 text-blue-500 font-semibold tracking-wide flex items-center w-max max-w-sm p-4 rounded-md shadow-md shadow-blue-200';
    }
});

const iconColor = computed(() => {
    switch (props.toastType) {
        case 'success':
            return 'bg-green-300 text-green-500';
        case 'error':
            return 'bg-red-300 text-red-500';
        case 'warning':
            return 'bg-yellow-300 text-yellow-500';
        default:
            return 'bg-blue-300 text-blue-500';
    }
});

const textColor = computed(() => {
    switch (props.toastType) {
        case 'success': return 'text-green-500';
        case 'error': return 'text-red-500';
        case 'warning': return 'text-yellow-500';
        default: return 'text-blue-500';
    }
});

const closeToast = () => {
    visible.value = false;
    emit('toastClosed');
};

setTimeout(() => {
    closeToast();
}, props.duration);

const progressBarColor = computed(() => {
    switch (props.toastType) {
        case 'success': return 'bg-green-300';
        case 'error': return 'bg-red-300';
        case 'warning': return 'bg-yellow-300';
        default: return 'bg-blue-300';
    }
});

const progressBarStyle = computed(() => ({
    width: `${progressWidth.value}%`,
    transitionDuration: `${props.duration}ms`,
}));

onMounted(() => {
    setTimeout(() => {
        progressWidth.value = 0;
    }, 50);
});
</script>

<style scoped>
.bounce-enter-from,
.bounce-leave-to {
    opacity: 0;
    transform: translateY(-30px) scale(0.8);
}

.bounce-enter-active,
.bounce-leave-active {
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    position: absolute;
}

@keyframes bounce-in {
    0% {
        transform: translateY(-30px) scale(0.8);
        opacity: 0;
    }

    60% {
        transform: translateY(10px) scale(1.05);
        opacity: 1;
    }

    100% {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
}
</style>