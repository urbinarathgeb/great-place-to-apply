<script setup lang="ts">
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
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxInput,
  ComboboxList,
  ComboboxViewport,
} from '@/components/ui/combobox'
import { XIcon, CheckIcon, SendIcon, CirclePlusIcon } from '@lucide/vue'
import ToastContainer from './ToastContainer.vue'
import {
  useReviewForm,
  type FormCompany,
  type FormStage,
} from '@/lib/useReviewForm'

const props = defineProps<{
  companies: FormCompany[]
  stages: FormStage[]
  initialCompanyId?: string | null
}>()

const {
  selectedCompanyId,
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
  aspectLabels,
  addStage,
  removeStage,
  setRating,
  orderedAspectsFor,
  isSuggestedForStage,
  availableInStageGroup,
  clearCompany,
  displayCompanyName,
  submit,
} = useReviewForm({
  companies: props.companies,
  stages: props.stages,
  initialCompanyId: props.initialCompanyId,
})
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
              <SelectGroup v-if="availableInStageGroup(i, g).length > 0">
                <SelectLabel>{{ g.phase }}</SelectLabel>
                <SelectItem
                  v-for="s in availableInStageGroup(i, g)"
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
