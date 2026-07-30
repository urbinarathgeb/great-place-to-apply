<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircleIcon, XCircleIcon, InfoIcon } from '@lucide/vue'
import { toastClass } from '@/lib/useToast'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

defineProps<{ toasts: Toast[] }>()

const isMounted = ref(false)
onMounted(() => { isMounted.value = true })

function toastIcon(type: Toast['type']) {
  if (type === 'success') return CheckCircleIcon
  if (type === 'error') return XCircleIcon
  return InfoIcon
}
</script>

<template>
  <Teleport to="body" v-if="isMounted">
    <div class="fixed inset-0 z-50 pointer-events-none flex flex-col items-center pt-[15vh]">
      <TransitionGroup name="toast" tag="div" class="flex flex-col items-center gap-3 w-full">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'flex items-center gap-4 px-8 py-5 rounded-xl border shadow-lg text-base pointer-events-auto min-w-[320px] max-w-md mx-auto',
            toastClass(t.type)
          ]"
        >
          <component :is="toastIcon(t.type)" class="size-6 shrink-0" />
          <span class="leading-relaxed mr-1 font-medium">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
