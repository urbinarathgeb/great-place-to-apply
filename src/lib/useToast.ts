import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export function useToast() {
  const toasts = ref<Toast[]>([])
  let nextId = 0

  function show(message: string, type: Toast['type'], duration = 3500) {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return { toasts, show }
}

const bgMap: Record<Toast['type'], string> = {
  success: 'bg-green-50 border-green-200 text-green-700',
  error: 'bg-destructive/10 border-destructive/20 text-destructive',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

export function toastClass(type: Toast['type']) {
  return bgMap[type]
}
