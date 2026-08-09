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
  success: 'bg-green-700 border-green-800 text-white',
  error: 'bg-destructive border-destructive text-white',
  info: 'bg-blue-700 border-blue-800 text-white',
}

export function toastClass(type: Toast['type']) {
  return bgMap[type]
}
