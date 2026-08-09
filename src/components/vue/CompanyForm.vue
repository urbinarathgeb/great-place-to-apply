<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/lib/useToast'
import ToastContainer from './ToastContainer.vue'
import {
  Building2Icon,
  GlobeIcon,
  TagsIcon,
  BriefcaseBusinessIcon,
  FileTextIcon,
  MapPinIcon,
  SendIcon,
  ChevronDownIcon,
} from '@lucide/vue'

interface Category {
  id: number
  name: string
  slug: string
}

const props = defineProps<{ categories: Category[] }>()

const name = ref('')
const website = ref('')
const careersUrl = ref('')
const description = ref('')
const location = ref('')
const categoryId = ref<number | null>(null)
const submitting = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})
const { toasts, show } = useToast()

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function firstError(): string {
  const values = Object.values(fieldErrors.value)
  return values[0]?.[0] ?? 'Revisa los campos marcados en el formulario'
}

function scrollToFirstError() {
  const keys = Object.keys(fieldErrors.value)
  if (keys.length === 0) return
  const target = document.querySelector(`[data-field="${keys[0]}"]`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  ;(target as HTMLElement | null)?.focus?.()
}

async function submit() {
  fieldErrors.value = {}

  if (!name.value.trim()) {
    fieldErrors.value = { name: ['El nombre es obligatorio'] }
    show(firstError(), 'error')
    scrollToFirstError()
    return
  }

  if (!categoryId.value) {
    fieldErrors.value = { categoryId: ['Selecciona una categoría'] }
    show(firstError(), 'error')
    scrollToFirstError()
    return
  }

  const payload = {
    name: name.value.trim(),
    website: normalizeUrl(website.value),
    careersUrl: normalizeUrl(careersUrl.value),
    description: description.value.trim() || null,
    location: location.value.trim() || null,
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
        show(firstError(), 'error')
      } else if (data.slug) {
        show('Esta empresa ya existe, redirigiendo...', 'info')
        setTimeout(() => { window.location.href = `/companies/${data.slug}` }, 1500)
        return
      } else {
        show(data.error || 'Error al crear la empresa', 'error')
      }
      scrollToFirstError()
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
      <label for="name" class="ml-1 text-sm font-semibold text-muted-foreground">
        Nombre de la empresa <span class="text-destructive">*</span>
      </label>
      <div :class="[
          'input-organic-wrap px-4 py-3',
          fieldErrors.name ? 'input-organic-wrap-error' : '',
        ]">
        <Building2Icon class="size-5 shrink-0 text-muted-foreground" />
        <input
          id="name"
          v-model="name"
          type="text"
          placeholder="Ej: TechSolutions Global"
          data-field="name"
          class="w-full border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0 md:text-sm"
        />
      </div>
      <p v-if="fieldErrors.name" class="text-sm text-destructive">
        {{ fieldErrors.name[0] }}
      </p>
    </div>

    <!-- Website -->
    <div class="flex flex-col gap-2">
      <label for="website" class="ml-1 text-sm font-semibold text-muted-foreground">
        Sitio web
        <span class="font-normal text-muted-foreground/70">(opcional)</span>
      </label>
      <div :class="[
          'input-organic-wrap px-4 py-3',
          fieldErrors.website ? 'input-organic-wrap-error' : '',
        ]">
        <GlobeIcon class="size-5 shrink-0 text-muted-foreground" />
        <input
          id="website"
          v-model="website"
          type="url"
          placeholder="empresa.com"
          data-field="website"
          class="w-full border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0 md:text-sm"
        />
      </div>
      <p v-if="fieldErrors.website" class="text-sm text-destructive">
        {{ fieldErrors.website[0] }}
      </p>
    </div>

    <!-- Category -->
    <div class="flex flex-col gap-2">
      <label for="category" class="ml-1 text-sm font-semibold text-muted-foreground">
        Categoría <span class="text-destructive">*</span>
      </label>
      <div :class="[
          'input-organic-wrap relative px-4 py-3',
          fieldErrors.categoryId ? 'input-organic-wrap-error' : '',
        ]">
        <TagsIcon class="size-5 shrink-0 text-muted-foreground" />
        <select
          id="category"
          v-model="categoryId"
          :class="categoryId ? 'text-foreground' : 'text-muted-foreground/70'"
          data-field="categoryId"
          class="w-full cursor-pointer appearance-none border-none bg-transparent pr-8 text-base outline-none focus:ring-0 md:text-sm"
        >
          <option :value="null" disabled>Selecciona una industria</option>
          <option
            v-for="c in props.categories"
            :key="c.id"
            :value="c.id"
          >
            {{ c.name }}
          </option>
        </select>
        <ChevronDownIcon
          class="pointer-events-none absolute right-4 size-5 shrink-0 text-muted-foreground"
        />
      </div>
      <p v-if="fieldErrors.categoryId" class="text-sm text-destructive">
        {{ fieldErrors.categoryId[0] }}
      </p>
    </div>

    <!-- Careers -->
    <div class="flex flex-col gap-2">
      <label for="careersUrl" class="ml-1 text-sm font-semibold text-muted-foreground">
        Página de empleos
        <span class="font-normal text-muted-foreground/70">(opcional)</span>
      </label>
      <div :class="[
          'input-organic-wrap px-4 py-3',
          fieldErrors.careersUrl ? 'input-organic-wrap-error' : '',
        ]">
        <BriefcaseBusinessIcon class="size-5 shrink-0 text-muted-foreground" />
        <input
          id="careersUrl"
          v-model="careersUrl"
          type="url"
          placeholder="empleos.empresa.com"
          data-field="careersUrl"
          class="w-full border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0 md:text-sm"
        />
      </div>
      <p v-if="fieldErrors.careersUrl" class="text-sm text-destructive">
        {{ fieldErrors.careersUrl[0] }}
      </p>
    </div>

    <!-- Description -->
    <div class="flex flex-col gap-2">
      <label for="description" class="ml-1 text-sm font-semibold text-muted-foreground">
        Descripción
        <span class="font-normal text-muted-foreground/70">(opcional)</span>
      </label>
      <div :class="[
          'input-organic-wrap px-4 py-3',
          fieldErrors.description ? 'input-organic-wrap-error' : '',
        ]">
        <FileTextIcon class="size-5 shrink-0 self-start text-muted-foreground" />
        <textarea
          id="description"
          v-model="description"
          rows="3"
          placeholder="Describe brevemente a qué se dedica la empresa..."
          data-field="description"
          class="w-full resize-y border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0 md:text-sm"
        />
      </div>
      <p v-if="fieldErrors.description" class="text-sm text-destructive">
        {{ fieldErrors.description[0] }}
      </p>
    </div>

    <!-- Location -->
    <div class="flex flex-col gap-2">
      <label for="location" class="ml-1 text-sm font-semibold text-muted-foreground">
        Ubicación
        <span class="font-normal text-muted-foreground/70">(opcional)</span>
      </label>
      <div :class="[
          'input-organic-wrap px-4 py-3',
          fieldErrors.location ? 'input-organic-wrap-error' : '',
        ]">
        <MapPinIcon class="size-5 shrink-0 text-muted-foreground" />
        <input
          id="location"
          v-model="location"
          type="text"
          placeholder="Ciudad, País"
          data-field="location"
          class="w-full border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0 md:text-sm"
        />
      </div>
      <p v-if="fieldErrors.location" class="text-sm text-destructive">
        {{ fieldErrors.location[0] }}
      </p>
    </div>

    <!-- Submit -->
    <div class="pt-2">
      <button
        type="submit"
        :disabled="submitting"
        class="btn-gradient inline-flex w-full items-center justify-center gap-3 rounded-full py-4 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
      >
        {{ submitting ? 'Creando...' : 'Crear empresa' }}
        <SendIcon v-if="!submitting" class="size-4" />
      </button>
      <p class="mt-4 text-center text-xs text-muted-foreground">
        Al hacer clic, aceptas nuestros términos de servicio y políticas de comunidad.
      </p>
    </div>
  </form>
  <ToastContainer :toasts="toasts" />
</template>
