<script setup lang="ts">
import { ref, computed } from 'vue'

interface ReviewItem {
  id: string
  role: string
  recommends: boolean
  createdAt: string
  comment: string
  avgScore: string
  stages: string[]
}

const props = defineProps<{
  reviews: ReviewItem[]
  companyName: string
  companySlug: string
}>()

const sortBy = ref<'recent' | 'best'>('recent')
const showAll = ref(false)
const expandedId = ref<string | null>(null)

const sorted = computed(() => {
  const list = [...props.reviews]
  if (sortBy.value === 'best') {
    list.sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  return list
})

const visible = computed(() => (showAll.value ? sorted.value : sorted.value.slice(0, 3)))

const hasMore = computed(() => props.reviews.length > 3)

const chipActive = 'inline-flex items-center rounded-full bg-primary text-white text-sm font-semibold px-4 py-2 transition-colors'
const chipIdle = 'inline-flex items-center rounded-full bg-white/70 border border-white/60 text-muted-foreground text-sm font-medium px-4 py-2 transition-all hover:text-primary hover:border-primary/40'

function scoreOf(r: ReviewItem) {
  const n = parseFloat(r.avgScore)
  return isNaN(n) ? '0.0' : n.toFixed(1)
}

function scoreNum(r: ReviewItem) {
  const n = parseFloat(r.avgScore)
  return isNaN(n) ? 0 : n
}

function isLong(r: ReviewItem) {
  return r.comment.length > 140
}

function formatDate(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div>
    <div class="flex gap-2" role="group" aria-label="Ordenar reseñas">
      <button :class="sortBy === 'recent' ? chipActive : chipIdle" @click="sortBy = 'recent'">
        Más recientes
      </button>
      <button :class="sortBy === 'best' ? chipActive : chipIdle" @click="sortBy = 'best'">
        Mejor puntuadas
      </button>
    </div>

    <div class="mt-6 space-y-4">
      <article
        v-for="r in visible"
        :key="r.id"
        class="glass shadow-float rounded-3xl p-6 flex flex-col lg:flex-row gap-5"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="inline-flex items-center rounded-full bg-secondary/10 text-secondary px-3 py-1 text-xs font-semibold">
              {{ r.role }}
            </span>
            <span class="text-xs text-muted-foreground">•</span>
            <span class="text-xs text-muted-foreground">{{ formatDate(r.createdAt) }}</span>
          </div>

          <div class="mt-3 flex items-center gap-0.5" :aria-label="`${scoreOf(r)} de 5 estrellas`" role="img">
            <svg
              v-for="star in 5"
              :key="star"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              :class="scoreNum(r) >= star
                ? 'text-primary fill-primary'
                : scoreNum(r) >= star - 0.5
                  ? 'text-primary fill-primary opacity-50'
                  : 'fill-none stroke-primary/30 text-primary'"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          <p :class="['mt-3 text-sm text-foreground leading-relaxed', expandedId === r.id ? '' : 'line-clamp-3']">
            {{ r.comment }}
          </p>
          <button
            v-if="isLong(r)"
            type="button"
            class="mt-1 text-xs font-semibold text-primary hover:underline"
            @click="toggleExpand(r.id)"
          >
            {{ expandedId === r.id ? 'Leer menos' : 'Leer más' }}
          </button>

          <div v-if="r.stages.length" class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="s in r.stages"
              :key="s"
              class="inline-flex items-center rounded-full bg-secondary/10 text-secondary px-2.5 py-0.5 text-[11px] font-semibold"
            >
              {{ s }}
            </span>
          </div>
        </div>

        <div class="lg:w-44 lg:shrink-0 lg:border-l lg:border-black/5 lg:pl-5 flex lg:flex-col items-center lg:items-start justify-between gap-x-3 gap-y-1.5 flex-wrap">
          <div class="flex items-center gap-1.5">
            <span class="text-2xl font-extrabold tabular-nums text-foreground">{{ scoreOf(r) }}</span>
            <span class="text-xs text-muted-foreground">· Recomendación</span>
          </div>
          <span
            :class="['inline-flex items-center gap-1.5 text-sm font-semibold', r.recommends ? 'text-secondary' : 'text-destructive']"
          >
            <svg v-if="r.recommends" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {{ r.recommends ? 'Recomienda' : 'No recomienda' }}
          </span>
          <a :href="`/reviews/${r.id}`" class="text-xs font-semibold text-primary hover:underline">
            Ver review completa
          </a>
        </div>
      </article>
    </div>

    <div v-if="hasMore" class="mt-8 text-center">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-full border border-primary/30 text-primary hover:bg-primary/5 h-11 px-8 text-sm font-semibold transition-all duration-200"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Mostrar menos' : `Ver todas las reseñas (${props.reviews.length})` }}
      </button>
    </div>
  </div>
</template>
