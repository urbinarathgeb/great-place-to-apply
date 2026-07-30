<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/lib/useToast'
import ToastContainer from './ToastContainer.vue'

interface Category {
  id: number
  name: string
  slug: string
}

const props = defineProps<{ categories: Category[] }>()

const name = ref('')
const website = ref('')
const categoryId = ref<number | null>(null)
const submitting = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})
const { toasts, show } = useToast()

async function submit() {
  fieldErrors.value = {}

  if (!name.value.trim()) {
    fieldErrors.value = { name: ['El nombre es obligatorio'] }
    return
  }

  if (!categoryId.value) {
    fieldErrors.value = { categoryId: ['Selecciona una categoría'] }
    return
  }

  const payload = {
    name: name.value.trim(),
    website: website.value.trim() || null,
    categoryId: categoryId.value,
  }

  submitting.value = true

  try {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.details) {
        const grouped: Record<string, string[]> = {}
        for (const issue of data.details) {
          const path = issue.path?.join('.') || 'general'
          if (!grouped[path]) grouped[path] = []
          grouped[path].push(issue.message)
        }
        fieldErrors.value = grouped
      }
      if (data.slug) {
        show('Esta empresa ya existe, redirigiendo...', 'info')
        setTimeout(() => { window.location.href = `/companies/${data.slug}` }, 1500)
        return
      }
      show(data.error || 'Error al crear la empresa', 'error')
      return
    }

    show('Empresa creada con éxito', 'success', 4000)
    setTimeout(() => { window.location.href = '/' }, 3000)
  } catch {
    show('Error de conexión. Intenta nuevamente.', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="flex flex-col gap-6" novalidate>
    <!-- Name -->
    <div class="flex flex-col gap-2">
      <label for="name" class="text-sm font-medium text-foreground">
        Nombre de la empresa <span class="text-destructive">*</span>
      </label>
      <input
        id="name"
        v-model="name"
        type="text"
        placeholder="Ej: Banco de Chile"
        class="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-3 py-2 text-base transition-colors focus-visible:ring-3 md:text-sm w-full outline-none placeholder:text-muted-foreground"
      />
      <p v-if="fieldErrors.name" class="text-sm text-destructive">
        {{ fieldErrors.name[0] }}
      </p>
    </div>

    <!-- Website -->
    <div class="flex flex-col gap-2">
      <label for="website" class="text-sm font-medium text-foreground">
        Sitio web
        <span class="text-muted-foreground font-normal">(opcional)</span>
      </label>
      <input
        id="website"
        v-model="website"
        type="url"
        placeholder="https://ejemplo.cl"
        class="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-3 py-2 text-base transition-colors focus-visible:ring-3 md:text-sm w-full outline-none placeholder:text-muted-foreground"
      />
      <p v-if="fieldErrors.website" class="text-sm text-destructive">
        {{ fieldErrors.website[0] }}
      </p>
    </div>

    <!-- Category -->
    <div class="flex flex-col gap-2">
      <label for="category" class="text-sm font-medium text-foreground">
        Categoría <span class="text-destructive">*</span>
      </label>
      <select
        id="category"
        v-model="categoryId"
        class="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-3 py-2 text-base transition-colors focus-visible:ring-3 md:text-sm w-full outline-none placeholder:text-muted-foreground"
      >
        <option :value="null" disabled>Seleccionar categoría</option>
        <option
          v-for="c in props.categories"
          :key="c.id"
          :value="c.id"
        >
          {{ c.name }}
        </option>
      </select>
      <p v-if="fieldErrors.categoryId" class="text-sm text-destructive">
        {{ fieldErrors.categoryId[0] }}
      </p>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="submitting"
      class="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 py-2 w-full"
    >
      {{ submitting ? 'Creando...' : 'Crear empresa' }}
    </button>
  </form>
  <ToastContainer :toasts="toasts" />
</template>
