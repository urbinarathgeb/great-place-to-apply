<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import ToastContainer from './ToastContainer.vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
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
import { XIcon, CheckIcon } from '@lucide/vue'
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
      <label class="text-sm font-medium text-foreground">Empresa</label>
      <Combobox
        v-model="selectedCompanyId"
        v-model:search-term="companyQuery"
        v-model:open="showDropdown"
      >
        <ComboboxAnchor class="relative flex items-center">
          <ComboboxInput
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
        Rol o puesto al que postulaste <span class="text-destructive">*</span>
      </label>
      <input
        id="role"
        v-model="role"
        type="text"
        placeholder="Ej: Analista de Riesgo"
        class="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-3 py-2 text-base transition-colors focus-visible:ring-3 md:text-sm w-full outline-none placeholder:text-muted-foreground"
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
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-input text-muted-foreground hover:border-ring hover:text-foreground'"
          class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          @click="recommends = recommends === true ? null : true"
        >
          Sí, la recomiendo
        </button>
        <button
          type="button"
          :class="recommends === false
            ? 'border-destructive bg-destructive/10 text-destructive'
            : 'border-input text-muted-foreground hover:border-ring hover:text-foreground'"
          class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
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
      <label for="comment" class="text-sm font-medium text-foreground">Comentario general</label>
      <textarea
        id="comment"
        v-model="comment"
        rows="4"
        placeholder="Cuenta tu experiencia general del proceso de selección..."
        class="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors focus-visible:ring-3 md:text-sm min-h-16 w-full outline-none placeholder:text-muted-foreground resize-y"
      />
      <p v-if="fieldErrors.comment || fieldErrors['stageReviews.comment']" class="text-sm text-destructive">
        {{ fieldErrors.comment?.[0] || fieldErrors['stageReviews.comment']?.[0] }}
      </p>
    </div>

    <!-- Stages -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-foreground">Etapas del proceso</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          :disabled="stages.length >= props.stages.length"
          @click="addStage"
        >
          + Agregar etapa
        </Button>
      </div>

      <div
        v-for="(stage, i) in stages"
        :key="i"
        class="rounded-xl border bg-card p-5 flex flex-col gap-4"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etapa {{ i + 1 }}</span>
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
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="s in availableStages(i)"
                :key="s.id"
                :value="s.id"
              >
                {{ s.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <textarea
          v-model="stage.comment"
          rows="3"
          placeholder="Comentario de esta etapa..."
          class="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors focus-visible:ring-3 md:text-sm min-h-16 w-full outline-none placeholder:text-muted-foreground resize-y"
        />

        <div>
          <p class="text-xs font-medium text-muted-foreground mb-2">Puntuaciones</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="aspect in aspects"
              :key="aspect"
              class="flex items-center justify-between gap-2"
            >
              <span class="text-sm text-foreground shrink-0">{{ aspectLabels[aspect] }}</span>
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
                      ? 'text-accent fill-accent'
                      : 'fill-none stroke-accent/30 text-accent'"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="stages.length === 0"
        class="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg"
      >
        Agrega al menos una etapa del proceso de selección
      </div>
    </div>

    <Button
      type="submit"
      class="w-full h-11"
      size="lg"
      :disabled="submitting"
    >
      {{ submitting ? 'Enviando...' : 'Enviar review' }}
    </Button>
  </form>
  <ToastContainer :toasts="toasts" />
</template>
