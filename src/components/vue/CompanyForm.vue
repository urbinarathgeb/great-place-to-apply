<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

async function submit() {
  error.value = ''
  fieldErrors.value = {}

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
      error.value = data.error || 'Error al crear la empresa'
      if (data.slug) {
        window.location.href = `/companies/${data.slug}`
        return
      }
      return
    }

    window.location.href = `/companies/${data.slug}`
  } catch {
    error.value = 'Error de conexión. Intenta nuevamente.'
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
      <label class="text-sm font-medium text-foreground">
        Categoría <span class="text-destructive">*</span>
      </label>
      <Select v-model="categoryId">
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="c in props.categories"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <p v-if="fieldErrors.categoryId" class="text-sm text-destructive">
        {{ fieldErrors.categoryId[0] }}
      </p>
    </div>

    <!-- Error general -->
    <div
      v-if="error"
      class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Submit -->
    <Button
      type="submit"
      class="w-full h-11"
      size="lg"
      :disabled="submitting"
    >
      {{ submitting ? 'Creando...' : 'Crear empresa' }}
    </Button>
  </form>
</template>
