<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

interface Company {
  id: string
  name: string
  slug: string
  categoryName: string | null
}

interface Stage {
  id: number
  name: string
}

const props = defineProps<{ companies: Company[]; stages: Stage[] }>()

const aspects = ['rapidez', 'feedback', 'transparencia', 'trato']

const companyQuery = ref('')
const showDropdown = ref(false)
const selectedCompany = ref<Company | null>(null)
const comment = ref('')
const submitting = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const filteredCompanies = computed(() => {
  const q = companyQuery.value.toLowerCase().trim()
  if (!q) return props.companies
  return props.companies.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    (c.categoryName && c.categoryName.toLowerCase().includes(q))
  )
})

function selectCompany(c: Company) {
  selectedCompany.value = c
  companyQuery.value = c.name
  showDropdown.value = false
  fieldErrors.value = {}
}

function clearCompany() {
  selectedCompany.value = null
  companyQuery.value = ''
  showDropdown.value = true
}

interface StageEntry {
  stageId: number | null
  comment: string
  ratings: Record<string, number>
}

const stages = reactive<StageEntry[]>([])

function addStage() {
  stages.push({ stageId: null, comment: '', ratings: { rapidez: 0, feedback: 0, transparencia: 0, trato: 0 } })
}

function removeStage(i: number) {
  stages.splice(i, 1)
}

function setRating(stageIdx: number, aspect: string, value: number) {
  stages[stageIdx].ratings[aspect] = stages[stageIdx].ratings[aspect] === value ? 0 : value
}

function activeRatings(stageIdx: number): number {
  return Object.values(stages[stageIdx].ratings).filter((v) => v > 0).length
}

const aspectLabels: Record<string, string> = {
  rapidez: 'Rapidez',
  feedback: 'Feedback',
  transparencia: 'Transparencia',
  trato: 'Trato',
}

async function submit() {
  error.value = ''
  fieldErrors.value = {}

  if (!selectedCompany.value) {
    fieldErrors.value = { company: ['Selecciona una empresa'] }
    return
  }

  const payload = {
    companyId: selectedCompany.value.id,
    comment: comment.value,
    stageReviews: stages.map((s) => ({
      stageId: s.stageId!,
      comment: s.comment,
      ratings: Object.entries(s.ratings)
        .filter(([, v]) => v > 0)
        .map(([aspectName, score]) => ({ aspectName, score })),
    })),
  }

  submitting.value = true

  try {
    const res = await fetch('/api/reviews', {
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
      error.value = data.error || 'Error al enviar la review'
      return
    }

    window.location.href = `/reviews/${data.id}`
  } catch (e) {
    error.value = 'Error de conexión. Intenta nuevamente.'
  } finally {
    submitting.value = false
  }
}

const stageOptions = computed(() =>
  props.stages.filter((s) => !stages.some((e) => e.stageId === s.id))
)

function availableStages(excludeIdx: number): Stage[] {
  return props.stages.filter(
    (s) => s.id === stages[excludeIdx].stageId || !stages.some((e, i) => i !== excludeIdx && e.stageId === s.id)
  )
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-8" novalidate>
    <!-- Company selector -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium text-foreground">Empresa</label>
      <div class="relative">
        <input
          v-model="companyQuery"
          type="text"
          placeholder="Buscar empresa..."
          class="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-50"
          :disabled="!!selectedCompany"
          @input="showDropdown = true"
          @focus="showDropdown = true"
          @blur="setTimeout(() => showDropdown = false, 200)"
        />
        <button
          v-if="selectedCompany"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          @click="clearCompany"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <Transition name="dropdown">
          <ul
            v-if="showDropdown && !selectedCompany && filteredCompanies.length > 0"
            class="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border bg-card shadow-lg"
          >
            <li
              v-for="c in filteredCompanies"
              :key="c.id"
              class="px-3 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors"
              @mousedown.prevent="selectCompany(c)"
            >
              <span class="font-medium text-foreground">{{ c.name }}</span>
              <span v-if="c.categoryName" class="ml-2 text-xs text-muted-foreground">{{ c.categoryName }}</span>
            </li>
          </ul>
        </Transition>
      </div>
      <p v-if="fieldErrors.company" class="text-xs text-destructive">{{ fieldErrors.company[0] }}</p>
      <p class="text-xs text-muted-foreground">
        ¿No encuentras tu empresa?
        <a href="/companies/new" class="text-primary hover:underline">Créala aquí</a>
      </p>
    </div>

    <!-- General comment -->
    <div class="space-y-1.5">
      <label for="comment" class="text-sm font-medium text-foreground">Comentario general</label>
      <textarea
        id="comment"
        v-model="comment"
        rows="4"
        placeholder="Cuenta tu experiencia general del proceso de selección..."
        class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-y"
      />
      <p v-if="fieldErrors['stageReviews.comment'] || fieldErrors.comment" class="text-xs text-destructive">
        {{ fieldErrors['stageReviews.comment']?.[0] || fieldErrors.comment?.[0] }}
      </p>
    </div>

    <!-- Stages -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-medium text-foreground">Etapas del proceso</h2>
        <button
          type="button"
          class="text-sm text-primary hover:underline transition-colors disabled:opacity-50"
          :disabled="stages.length >= props.stages.length"
          @click="addStage"
        >
          + Agregar etapa
        </button>
      </div>

      <div
        v-for="(stage, i) in stages"
        :key="i"
        class="rounded-lg border bg-card p-4 space-y-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etapa {{ i + 1 }}</span>
          <button
            type="button"
            class="text-xs text-muted-foreground hover:text-destructive transition-colors"
            @click="removeStage(i)"
          >
            Eliminar
          </button>
        </div>

        <select
          v-model="stage.stageId"
          class="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        >
          <option :value="null" disabled>Seleccionar etapa</option>
          <option
            v-for="s in availableStages(i)"
            :key="s.id"
            :value="s.id"
          >
            {{ s.name }}
          </option>
        </select>
        <p v-if="fieldErrors[`stageReviews.${i}.stageId`]" class="text-xs text-destructive">
          {{ fieldErrors[`stageReviews.${i}.stageId`][0] }}
        </p>

        <textarea
          v-model="stage.comment"
          rows="3"
          placeholder="Comentario de esta etapa..."
          class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-y"
        />
        <p v-if="fieldErrors[`stageReviews.${i}.comment`]" class="text-xs text-destructive">
          {{ fieldErrors[`stageReviews.${i}.comment`][0] }}
        </p>

        <div>
          <p class="text-xs font-medium text-muted-foreground mb-2">Puntuaciones</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div v-for="aspect in aspects" :key="aspect" class="flex items-center justify-between gap-2">
              <span class="text-xs text-foreground capitalize shrink-0">{{ aspectLabels[aspect] }}</span>
              <div class="flex gap-0.5">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  class="p-0.5 transition-colors hover:scale-110"
                  @click="setRating(i, aspect, n)"
                >
                  <svg
                    width="18" height="18" viewBox="0 0 24 24"
                    :class="n <= stage.ratings[aspect]
                      ? 'text-accent fill-accent'
                      : 'fill-none stroke-accent/30 text-accent'"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p v-if="fieldErrors[`stageReviews.${i}.ratings`]" class="text-xs text-destructive mt-1">
            {{ fieldErrors[`stageReviews.${i}.ratings`][0] }}
          </p>
        </div>
      </div>

      <p v-if="stages.length === 0" class="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
        Agrega al menos una etapa del proceso de selección
      </p>
      <p v-if="fieldErrors['stageReviews']" class="text-xs text-destructive">{{ fieldErrors['stageReviews'][0] }}</p>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
      {{ error }}
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="submitting"
      class="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {{ submitting ? 'Enviando...' : 'Enviar review' }}
    </button>
  </form>
</template>

<style>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.12s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}
</style>
