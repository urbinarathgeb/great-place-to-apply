<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import ToastContainer from './ToastContainer.vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxViewport,
} from '@/components/ui/combobox'
import { XIcon, CheckIcon, SendIcon, CirclePlusIcon } from '@lucide/vue'
import { useToast } from '@/lib/useToast'

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

const props = defineProps<{
  companies: Company[]
  stages: Stage[]
  initialCompanyId?: string | null
}>()

onMounted(() => {
  if (props.initialCompanyId) {
    selectedCompanyId.value = props.initialCompanyId
  }
})

const aspects = ['rapidez', 'feedback', 'transparencia', 'trato']

const selectedCompanyId = ref<string | null>(null)
const selectedCompany = ref<Company | null>(null)
const companyQuery = ref('')
const showDropdown = ref(false)
const role = ref('')
const recommends = ref<boolean | null>(null)
const comment = ref('')
const submitting = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})
const { toasts, show } = useToast()

watch(selectedCompanyId, (id) => {
  if (id) {
    selectedCompany.value = props.companies.find((c) => c.id === id) ?? null
  } else {
    selectedCompany.value = null
  }
})

const filteredCompanies = computed(() => {
  const q = companyQuery.value.toLowerCase().trim()
  if (!q) return props.companies
  return props.companies.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.categoryName && c.categoryName.toLowerCase().includes(q)),
  )
})

function clearCompany() {
  selectedCompanyId.value = null
  selectedCompany.value = null
  companyQuery.value = ''
}

function displayCompanyName(id: unknown): string {
  return props.companies.find((c) => c.id === id)?.name ?? ''
}

interface StageEntry {
  stageId: number | null
  comment: string
  ratings: Record<string, number>
}

const stages = reactive<StageEntry[]>([])

function addStage() {
  stages.push({
    stageId: null,
    comment: '',
    ratings: { rapidez: 0, feedback: 0, transparencia: 0, trato: 0 },
  })
}

function removeStage(i: number) {
  stages.splice(i, 1)
}

function setRating(stageIdx: number, aspect: string, value: number) {
  stages[stageIdx].ratings[aspect] =
    stages[stageIdx].ratings[aspect] === value ? 0 : value
}

const aspectLabels: Record<string, string> = {
  rapidez: 'Rapidez',
  feedback: 'Feedback',
  transparencia: 'Transparencia',
  trato: 'Trato',
}

const stageAspectHints: Record<string, string[]> = {
  'Postulación Enviada': ['rapidez', 'transparencia'],
  'Screening o primera llamada': ['trato', 'rapidez', 'transparencia'],
  'Entrevista con HR o Reclutador': ['trato', 'rapidez', 'feedback'],
  'Entrevista técnica': ['rapidez', 'feedback', 'transparencia'],
  'Entrevista con el líder del equipo (Hiring Manager)': ['trato', 'feedback'],
  'Entrevista con el equipo o Panel': ['trato', 'feedback'],
  'Entrevista con dirección / C-level / CEO': ['trato', 'transparencia'],
  'Prueba práctica o caso (take-home)': ['rapidez', 'feedback'],
  'Test psicométrico o aptitudes': ['transparencia', 'rapidez'],
  'Assessment center / dinámica grupal': ['trato', 'feedback'],
  'Oferta laboral / negociación': ['transparencia', 'trato'],
  'Resultado del proceso': ['transparencia', 'feedback'],
}

const stagePhase: Record<string, string> = {
  'Postulación Enviada': 'Aplicación',
  'Screening o primera llamada': 'Entrevistas',
  'Entrevista con HR o Reclutador': 'Entrevistas',
  'Entrevista técnica': 'Entrevistas',
  'Entrevista con el líder del equipo (Hiring Manager)': 'Entrevistas',
  'Entrevista con el equipo o Panel': 'Entrevistas',
  'Entrevista con dirección / C-level / CEO': 'Entrevistas',
  'Prueba práctica o caso (take-home)': 'Pruebas y evaluaciones',
  'Test psicométrico o aptitudes': 'Pruebas y evaluaciones',
  'Assessment center / dinámica grupal': 'Pruebas y evaluaciones',
  'Oferta laboral / negociación': 'Oferta y cierre',
  'Resultado del proceso': 'Oferta y cierre',
}

const stagePhases = ['Aplicación', 'Entrevistas', 'Pruebas y evaluaciones', 'Oferta y cierre', 'Otras']

const stageGroups = computed(() =>
  stagePhases
    .map((phase) => ({
      phase,
      stages: props.stages.filter((s) => (stagePhase[s.name] ?? 'Otras') === phase),
    }))
    .filter((g) => g.stages.length > 0),
)

function stageNameOf(stage: StageEntry): string {
  return props.stages.find((s) => s.id === stage.stageId)?.name ?? ''
}

function orderedAspectsFor(stage: StageEntry): string[] {
  const hints = stageAspectHints[stageNameOf(stage)] ?? []
  return [...hints, ...aspects.filter((a) => !hints.includes(a))]
}

function isSuggestedForStage(stage: StageEntry, aspect: string): boolean {
  return (stageAspectHints[stageNameOf(stage)] ?? []).includes(aspect)
}

function availableInGroup(stageIdx: number, group: { phase: string; stages: Stage[] }): Stage[] {
  const ids = new Set(availableStages(stageIdx).map((s) => s.id))
  return group.stages.filter((s) => ids.has(s.id))
}

const stageOptions = computed(() =>
  props.stages.filter((s) => !stages.some((e) => e.stageId === s.id)),
)

function availableStages(excludeIdx: number): Stage[] {
  return props.stages.filter(
    (s) =>
      s.id === stages[excludeIdx].stageId ||
      !stages.some((e, i) => i !== excludeIdx && e.stageId === s.id),
  )
}

async function submit() {
  fieldErrors.value = {}

  if (!selectedCompany.value) {
    fieldErrors.value = { company: ['Selecciona una empresa'] }
    return
  }

  if (!role.value.trim()) {
    fieldErrors.value = { role: ['El rol o puesto es obligatorio'] }
    return
  }

  if (recommends.value === null) {
    fieldErrors.value = { recommends: ['Indica si recomendarías esta empresa'] }
    return
  }

  const unratedStage = stages.findIndex((s) => !Object.values(s.ratings).some((v) => v > 0))
  if (unratedStage !== -1) {
    fieldErrors.value = {
      [`stageReviews.${unratedStage}.ratings`]: ['Califica al menos un aspecto en esta etapa'],
    }
    return
  }

  const payload = {
    companyId: selectedCompany.value.id,
    role: role.value.trim(),
    recommends: recommends.value,
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
      show(data.error || 'Error al enviar la review', 'error')
      return
    }

    show('Review enviada con éxito', 'success', 4000)
    setTimeout(() => { window.location.href = `/reviews/${data.id}` }, 3000)
  } catch {
    show('Error de conexión. Intenta nuevamente.', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="flex flex-col gap-6" novalidate>
    <!-- Company -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-foreground">
        ¿Para qué empresa postulaste?
      </label>
      <Combobox
        v-model="selectedCompanyId"
        v-model:search-term="companyQuery"
        v-model:open="showDropdown"
      >
        <ComboboxAnchor class="relative flex items-center">
          <ComboboxInput
            wrapper-class="combobox-organic"
            class="pe-8"
            placeholder="Buscar empresa..."
            :display-value="displayCompanyName"
          />
          <button
            v-if="selectedCompanyId"
            type="button"
            class="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            @click="clearCompany"
          >
            <XIcon class="size-4" />
          </button>
        </ComboboxAnchor>
        <ComboboxList>
          <ComboboxViewport>
            <ComboboxEmpty>No se encontraron empresas</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxItem
                v-for="c in filteredCompanies"
                :key="c.id"
                :value="c.id"
              >
                <span>{{ c.name }}</span>
                <span
                  v-if="c.categoryName"
                  class="text-muted-foreground text-xs ml-2"
                >
                  {{ c.categoryName }}
                </span>
                <ComboboxItemIndicator>
                  <CheckIcon />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxViewport>
        </ComboboxList>
      </Combobox>
      <p v-if="fieldErrors.company" class="text-sm text-destructive">
        {{ fieldErrors.company[0] }}
      </p>
      <p class="text-xs text-muted-foreground">
        ¿No encuentras tu empresa?
        <a href="/companies/new" class="text-primary hover:underline">Créala aquí</a>
      </p>
    </div>

    <!-- Role -->
    <div class="flex flex-col gap-2">
      <label for="role" class="text-sm font-medium text-foreground">
        Puesto o rol al que postulaste <span class="text-destructive">*</span>
      </label>
      <input
        id="role"
        v-model="role"
        type="text"
        placeholder="Ej: Analista de Riesgo"
        class="input-organic w-full px-4 py-3 text-base md:text-sm outline-none placeholder:text-muted-foreground"
      />
      <p v-if="fieldErrors.role" class="text-sm text-destructive">
        {{ fieldErrors.role[0] }}
      </p>
    </div>

    <!-- Recommendation -->
    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-foreground">
        ¿Recomendarías esta empresa? <span class="text-destructive">*</span>
      </span>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          :class="recommends === true
            ? 'border-primary/40 bg-primary-fixed text-primary'
            : 'border-input/60 bg-white/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'"
          class="rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors"
          @click="recommends = recommends === true ? null : true"
        >
          Sí, la recomiendo
        </button>
        <button
          type="button"
          :class="recommends === false
            ? 'border-destructive/40 bg-destructive/10 text-destructive'
            : 'border-input/60 bg-white/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'"
          class="rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors"
          @click="recommends = recommends === false ? null : false"
        >
          No la recomiendo
        </button>
      </div>
      <p v-if="fieldErrors.recommends" class="text-sm text-destructive">
        {{ fieldErrors.recommends[0] }}
      </p>
    </div>

    <!-- General comment -->
    <div class="flex flex-col gap-2">
      <label for="comment" class="text-sm font-medium text-foreground">
        Resumen general de tu experiencia
      </label>
      <textarea
        id="comment"
        v-model="comment"
        rows="4"
        placeholder="Cuéntanos qué tal fue el trato, la claridad de la información y tus impresiones generales..."
        class="input-organic w-full min-h-16 px-4 py-3 text-base md:text-sm resize-y outline-none placeholder:text-muted-foreground"
      />
      <p v-if="fieldErrors.comment || fieldErrors['stageReviews.comment']" class="text-sm text-destructive">
        {{ fieldErrors.comment?.[0] || fieldErrors['stageReviews.comment']?.[0] }}
      </p>
    </div>

    <!-- Stages -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-foreground">Pasos del proceso</h2>
        <button
          type="button"
          class="flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline disabled:pointer-events-none disabled:opacity-50"
          :disabled="stages.length >= props.stages.length"
          @click="addStage"
        >
          <CirclePlusIcon class="size-4" />
          Añadir paso
        </button>
      </div>

      <div
        v-for="(stage, i) in stages"
        :key="i"
        class="rounded-xl border border-primary/10 bg-[#f0f3ff]/50 p-5 flex flex-col gap-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-semibold text-primary"
              aria-hidden="true"
            >
              {{ i + 1 }}
            </div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Etapa {{ i + 1 }}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="text-muted-foreground hover:text-destructive"
            @click="removeStage(i)"
          >
            Eliminar
          </Button>
        </div>

        <Select v-model="stage.stageId">
          <SelectTrigger class="h-11 w-full rounded-xl border-primary/15 bg-[#f0f3ff]/60">
            <SelectValue placeholder="Seleccionar etapa" />
          </SelectTrigger>
          <SelectContent>
            <template v-for="g in stageGroups" :key="g.phase">
              <SelectGroup v-if="availableInGroup(i, g).length > 0">
                <SelectLabel>{{ g.phase }}</SelectLabel>
                <SelectItem
                  v-for="s in availableInGroup(i, g)"
                  :key="s.id"
                  :value="s.id"
                >
                  {{ s.name }}
                </SelectItem>
              </SelectGroup>
            </template>
          </SelectContent>
        </Select>

        <textarea
          v-model="stage.comment"
          rows="3"
          placeholder="Comentario de esta etapa..."
          class="input-organic w-full min-h-16 px-4 py-3 text-base md:text-sm resize-y outline-none placeholder:text-muted-foreground"
        />

        <div>
          <p class="text-xs font-medium text-muted-foreground mb-1">Puntuaciones</p>
          <p class="text-[11px] text-muted-foreground/70 mb-2">
            Al menos 1 por etapa. Califica los que apliquen; los sugeridos aparecen primero.
          </p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="aspect in orderedAspectsFor(stage)"
              :key="aspect"
              class="flex items-center justify-between gap-2"
            >
              <span class="flex items-center gap-1.5 text-sm text-foreground shrink-0">
                {{ aspectLabels[aspect] }}
                <span
                  v-if="isSuggestedForStage(stage, aspect)"
                  class="text-[10px] font-semibold text-secondary bg-secondary/10 rounded-full px-1.5 py-0.5"
                >
                  sugerido
                </span>
              </span>
              <div class="flex gap-0.5">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  class="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  @click="setRating(i, aspect, n)"
                >
                  <svg
                    width="20" height="20" viewBox="0 0 24 24"
                    :class="n <= stage.ratings[aspect]
                      ? 'text-secondary fill-secondary'
                      : 'fill-none stroke-secondary/30 text-secondary/30'"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p
            v-if="fieldErrors[`stageReviews.${i}.ratings`]"
            class="mt-2 text-sm text-destructive"
          >
            {{ fieldErrors[`stageReviews.${i}.ratings`][0] }}
          </p>
        </div>
      </div>

      <div
        v-if="stages.length === 0"
        class="text-sm text-muted-foreground text-center py-6 border-2 border-dashed border-primary/20 rounded-xl"
      >
        Agrega al menos una etapa del proceso de selección
      </div>
    </div>

    <div class="pt-6 border-t border-white/40 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-xs text-muted-foreground text-center md:text-left leading-relaxed max-w-xs">
        Al enviar, aceptas nuestros términos de comunidad y veracidad de la información.
      </p>
      <Button
        type="submit"
        size="lg"
        class="h-11 w-full md:w-auto rounded-full px-8 gap-2 btn-gradient text-white shadow-[0_4px_14px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.4)]"
        :disabled="submitting"
      >
        {{ submitting ? 'Enviando...' : 'Enviar review' }}
        <SendIcon v-if="!submitting" class="size-4" />
      </Button>
    </div>
  </form>
  <ToastContainer :toasts="toasts" />
</template>

<style scoped>
.combobox-organic {
  background-color: rgb(240 243 255 / 0.6);
  border-color: rgb(79 70 229 / 0.15);
  height: 2.75rem;
  border-radius: 0.75rem;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.combobox-organic:focus-within {
  background-color: #ffffff;
  border-color: #3525cd;
  box-shadow: 0 0 0 4px rgb(79 70 229 / 0.1);
  outline: none;
}
</style>
