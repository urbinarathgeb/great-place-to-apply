import { ref, reactive, computed, watch } from 'vue'
import { useToast } from './useToast'

export interface FormCompany {
  id: string
  name: string
  slug: string
  categoryName: string | null
}

export interface FormStage {
  id: number
  name: string
}

export interface UseReviewFormOptions {
  companies: FormCompany[]
  stages: FormStage[]
  initialCompanyId?: string | null
}

interface StageEntry {
  stageId: number | null
  comment: string
  ratings: Record<string, number>
}

export const aspects = ['rapidez', 'feedback', 'transparencia', 'trato']

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

export function useReviewForm(options: UseReviewFormOptions) {
  const selectedCompanyId = ref<string | null>(null)
  const selectedCompany = ref<FormCompany | null>(null)
  const companyQuery = ref('')
  const showDropdown = ref(false)
  const role = ref('')
  const recommends = ref<boolean | null>(null)
  const comment = ref('')
  const submitting = ref(false)
  const fieldErrors = ref<Record<string, string[]>>({})
  const { toasts, show } = useToast()

  const stages = reactive<StageEntry[]>([])

  watch(selectedCompanyId, (id) => {
    if (id) {
      selectedCompany.value = options.companies.find((c) => c.id === id) ?? null
    } else {
      selectedCompany.value = null
    }
  })

  if (options.initialCompanyId) {
    selectedCompanyId.value = options.initialCompanyId
  }

  const filteredCompanies = computed(() => {
    const q = companyQuery.value.toLowerCase().trim()
    if (!q) return options.companies
    return options.companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(q)),
    )
  })

  const stageGroups = computed(() =>
    stagePhases
      .map((phase) => ({
        phase,
        stages: options.stages.filter((s) => (stagePhase[s.name] ?? 'Otras') === phase),
      }))
      .filter((g) => g.stages.length > 0),
  )

  const stageOptions = computed(() =>
    options.stages.filter((s) => !stages.some((e) => e.stageId === s.id)),
  )

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

  function stageNameOf(stage: StageEntry): string {
    return options.stages.find((s) => s.id === stage.stageId)?.name ?? ''
  }

  function orderedAspectsFor(stage: StageEntry): string[] {
    const hints = stageAspectHints[stageNameOf(stage)] ?? []
    return [...hints, ...aspects.filter((a) => !hints.includes(a))]
  }

  function isSuggestedForStage(stage: StageEntry, aspect: string): boolean {
    return (stageAspectHints[stageNameOf(stage)] ?? []).includes(aspect)
  }

  function availableInStageGroup(stageIdx: number, group: { phase: string; stages: FormStage[] }): FormStage[] {
    const ids = new Set(availableStages(stageIdx).map((s) => s.id))
    return group.stages.filter((s) => ids.has(s.id))
  }

  function availableStages(excludeIdx: number): FormStage[] {
    return options.stages.filter(
      (s) =>
        s.id === stages[excludeIdx].stageId ||
        !stages.some((e, i) => i !== excludeIdx && e.stageId === s.id),
    )
  }

  function clearCompany() {
    selectedCompanyId.value = null
    selectedCompany.value = null
    companyQuery.value = ''
  }

  function displayCompanyName(id: unknown): string {
    return options.companies.find((c) => c.id === id)?.name ?? ''
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

  return {
    selectedCompanyId,
    selectedCompany,
    companyQuery,
    showDropdown,
    role,
    recommends,
    comment,
    submitting,
    fieldErrors,
    toasts,
    stages,
    filteredCompanies,
    stageGroups,
    stageOptions,
    aspectLabels,
    addStage,
    removeStage,
    setRating,
    stageNameOf,
    orderedAspectsFor,
    isSuggestedForStage,
    availableInStageGroup,
    availableStages,
    clearCompany,
    displayCompanyName,
    submit,
  }
}
