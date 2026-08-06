<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

interface Category {
  id: number
  name: string
  slug: string
}

interface Company {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  categoryName: string | null
  categorySlug: string | null
  reviewsCount: number
  avgScore: string
  latestComment: string | null
  latestCommentDate: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const props = defineProps<{
  companies: Company[]
  pagination: Pagination
  categories: Category[]
  initialQ?: string
  initialCategory?: string
}>()

const LIMIT = 12

const companies = ref<Company[]>([...props.companies])
const total = ref(props.pagination.total)
const totalPages = ref(props.pagination.totalPages)
const currentPage = ref(props.pagination.page)
const q = ref(props.initialQ ?? '')
const activeCategory = ref(props.initialCategory ?? '')
const loading = ref(false)
const loadingMore = ref(false)
const error = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let controller: AbortController | null = null

const chipActive = 'inline-flex items-center rounded-full bg-primary text-white text-sm font-semibold px-4 py-2 transition-colors'
const chipIdle = 'inline-flex items-center rounded-full bg-white/70 border border-white/60 text-muted-foreground text-sm font-medium px-4 py-2 transition-all hover:text-primary hover:border-primary/40'
const btnOutline = 'inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 border border-primary/30 text-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50 h-11 px-8'

const shown = computed(() => companies.value.length)
const hasMore = computed(() => currentPage.value < totalPages.value)
const hasFilters = computed(() => q.value.trim() !== '' || activeCategory.value !== '')

const activeCategoryName = computed(
  () => props.categories.find((c) => c.slug === activeCategory.value)?.name ?? activeCategory.value,
)

const resultLabel = computed(() => {
  if (total.value === 0) return ''
  const noun = total.value === 1 ? 'empresa' : 'empresas'
  return `Mostrando ${shown.value} de ${total.value} ${noun}`
})

function syncUrl() {
  const params = new URLSearchParams()
  const trimmed = q.value.trim()
  if (trimmed) params.set('q', trimmed)
  if (activeCategory.value) params.set('category', activeCategory.value)
  const qs = params.toString()
  history.replaceState(null, '', qs ? `/companies?${qs}` : '/companies')
}

function queryString(page: number) {
  const params = new URLSearchParams()
  const trimmed = q.value.trim()
  if (trimmed) params.set('q', trimmed)
  if (activeCategory.value) params.set('category', activeCategory.value)
  params.set('page', String(page))
  params.set('limit', String(LIMIT))
  return `?${params.toString()}`
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchFirstPage, 300)
}

function onSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  fetchFirstPage()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    onSearch()
  }
}

function selectCategory(slug: string) {
  activeCategory.value = slug
  fetchFirstPage()
}

function clearFilters() {
  q.value = ''
  activeCategory.value = ''
  fetchFirstPage()
}

async function fetchFirstPage() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = false
  syncUrl()
  try {
    const res = await fetch(`/api/companies${queryString(1)}`, { signal: controller.signal })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    companies.value = data.companies
    total.value = data.pagination.total
    totalPages.value = data.pagination.totalPages
    currentPage.value = 1
  } catch (err) {
    if ((err as Error).name !== 'AbortError') error.value = true
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  controller?.abort()
  controller = new AbortController()
  loadingMore.value = true
  error.value = false
  try {
    const next = currentPage.value + 1
    const res = await fetch(`/api/companies${queryString(next)}`, { signal: controller.signal })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    companies.value = [...companies.value, ...data.companies]
    total.value = data.pagination.total
    totalPages.value = data.pagination.totalPages
    currentPage.value = next
  } catch (err) {
    if ((err as Error).name !== 'AbortError') error.value = true
  } finally {
    loadingMore.value = false
  }
}

function scoreOf(c: Company) {
  const n = parseFloat(c.avgScore)
  return isNaN(n) ? '0' : n.toFixed(1)
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const SPAN_BY_SIZE: Record<number, number> = {
  '-2': 3,
  '-1': 4,
  '0': 6,
  '1': 7,
  '2': 8,
}

const SPAN_CLASS_BY_SPAN: Record<number, string> = {
  3: 'lg:col-span-3 xl:col-span-3',
  4: 'lg:col-span-4 xl:col-span-4',
  5: 'lg:col-span-5 xl:col-span-5',
  6: 'lg:col-span-6 xl:col-span-6',
  7: 'lg:col-span-7 xl:col-span-7',
  8: 'lg:col-span-8 xl:col-span-8',
}

const ROW_PATTERNS_BY_COUNT: Record<number, number[][]> = {
  2: [
    [8, 4],
    [7, 5],
    [6, 6],
  ],
  3: [
    [6, 3, 3],
    [4, 4, 4],
    [5, 4, 3],
  ],
  4: [[3, 3, 3, 3]],
}

function sizeOf(company: Company, index: number) {
  let size = 0
  if (company.reviewsCount >= 8) size += 2
  else if (company.reviewsCount >= 1) size += 1
  if (company.name.length >= 20) size += 1
  if (index % 5 === 0) size += 1
  else if (index % 5 === 3) size -= 1
  return Math.max(-2, Math.min(2, size))
}

function desiredSpan(company: Company, index: number) {
  return SPAN_BY_SIZE[sizeOf(company, index)] ?? 6
}

function permutationsWithDedup(values: number[]): number[][] {
  const seen = new Set<string>()
  const result: number[][] = []
  const used = new Array(values.length).fill(false)

  function backtrack(current: number[]) {
    if (current.length === values.length) {
      const key = current.join(',')
      if (!seen.has(key)) {
        seen.add(key)
        result.push([...current])
      }
      return
    }
    for (let i = 0; i < values.length; i++) {
      if (used[i]) continue
      used[i] = true
      current.push(values[i])
      backtrack(current)
      current.pop()
      used[i] = false
    }
  }

  backtrack([])
  return result
}

const ROW_SHAPES = [2, 3, 4]

function weightedRowShape(counter: number) {
  const r = (counter * 7 + 5) % 10
  if (r < 4) return 2
  if (r < 8) return 3
  return 4
}

function bestPatternForK(items: Company[], start: number, k: number) {
  const patterns = ROW_PATTERNS_BY_COUNT[k]
  const desireds = items.slice(start, start + k).map((c, j) => desiredSpan(c, start + j))
  let best: { pattern: number[]; cost: number } | null = null
  for (const pattern of patterns) {
    const sorted = [...pattern].sort((a, b) => a - b)
    const sortedDesireds = [...desireds].sort((a, b) => a - b)
    const cost = sorted.reduce((acc, span, i) => acc + Math.abs(span - sortedDesireds[i]), 0)
    if (!best || cost < best.cost) best = { pattern, cost }
  }
  return best
}

function nextRowShape(remaining: number, shapeCounter: number) {
  if (remaining === 1) return null
  for (let attempt = 0; attempt < ROW_SHAPES.length; attempt++) {
    const k = weightedRowShape(shapeCounter + attempt)
    if (k <= remaining && remaining - k !== 1) return k
  }
  for (const k of ROW_SHAPES) {
    if (k <= remaining && remaining - k !== 1) return k
  }
  return remaining >= 3 ? 3 : remaining
}

function buildLayout(items: Company[]) {
  const placed: { company: Company; span: number; idx: number }[] = []
  let idx = 0
  let shapeCounter = 0
  let rowCounter = 0
  while (idx < items.length) {
    const k = nextRowShape(items.length - idx, shapeCounter)
    shapeCounter += 1
    if (k === null) {
      placed.push({ company: items[idx], span: 6, idx })
      idx += 1
      continue
    }
    const row = bestPatternForK(items, idx, k)
    if (!row) {
      placed.push({ company: items[idx], span: 6, idx })
      idx += 1
      continue
    }
    const perms = permutationsWithDedup(row.pattern)
    const chosen = perms[rowCounter % perms.length]
    rowCounter += 1
    for (const span of chosen) {
      placed.push({ company: items[idx], span, idx })
      idx += 1
    }
  }
  return placed.map((p) => ({
    c: p.company,
    spanClass: SPAN_CLASS_BY_SPAN[p.span] ?? 'lg:col-span-6 xl:col-span-6',
    isLarge: p.span >= 8,
  }))
}

const layout = computed(() => buildLayout(companies.value))

function timeAgo(value: string | null) {
  if (!value) return ''
  const then = new Date(value)
  if (isNaN(then.getTime())) return ''
  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `hace ${days} ${days === 1 ? 'día' : 'días'}`
  const months = Math.round(days / 30)
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.round(months / 12)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}

onBeforeUnmount(() => {
  controller?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div>
    <!-- Search pill -->
    <div class="glass shadow-float p-2 rounded-full flex flex-col md:flex-row gap-2 w-full">
      <div class="flex-1 flex items-center px-6 gap-3">
        <svg
          class="text-primary shrink-0"
          width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          v-model="q"
          type="search"
          placeholder="¿Qué empresa estás buscando?"
          class="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-base text-foreground placeholder:text-muted-foreground py-3.5"
          @input="onInput"
          @keydown="onKeydown"
        />
      </div>
      <div class="flex gap-2 p-1">
        <button
          class="btn-gradient text-white px-8 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_rgba(79,70,229,0.25)]"
          @click="onSearch"
        >
          Buscar
        </button>
      </div>
    </div>

    <!-- Category chips -->
    <div class="flex flex-wrap gap-2 mt-5" role="group" aria-label="Filtrar por categoría">
      <button :class="activeCategory === '' ? chipActive : chipIdle" @click="selectCategory('')">
        Todas
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="activeCategory === cat.slug ? chipActive : chipIdle"
        @click="selectCategory(cat.slug)"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Result count -->
    <div class="flex items-center justify-between mt-8 mb-4">
      <p class="text-sm text-muted-foreground font-medium">
        {{ resultLabel }}
        <span v-if="loading && shown > 0" class="text-muted-foreground/60">· actualizando…</span>
      </p>
    </div>

    <!-- Skeleton (first load) -->
    <div v-if="loading && shown === 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12" aria-hidden="true">
      <div v-for="i in 8" :key="i" :class="['glass rounded-2xl p-6 h-52 animate-pulse', i % 3 === 0 ? 'lg:col-span-6' : 'lg:col-span-4']"></div>
    </div>

    <!-- Grid -->
    <div
      v-else-if="shown > 0"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12"
      :class="loading ? 'opacity-60 pointer-events-none' : ''"
    >
      <div
        v-for="item in layout"
        :key="item.c.id"
        :class="[
          'glass shadow-float group rounded-2xl p-6 flex flex-col h-full relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
          item.spanClass,
          item.c.reviewsCount > 0 ? 'ring-1 ring-primary/15' : '',
        ]"
      >
        <a
          :href="`/companies/${item.c.slug}`"
          class="absolute inset-0 z-0 rounded-2xl"
          :aria-label="`Ver ${item.c.name}`"
        ></a>

        <div class="relative z-10 flex flex-col h-full pointer-events-none">
          <div class="flex items-start justify-between gap-4">
            <span
              :class="[
                'rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center font-bold text-primary shrink-0',
                item.isLarge ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-base',
              ]"
            >
              {{ initialsOf(item.c.name) }}
            </span>
            <span class="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white text-sm font-bold px-3.5 py-1.5 shadow-[0_4px_14px_rgba(79,70,229,0.4)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1.5" stroke-linejoin="round">
                <path d="M12 2l2.9 6.26 6.85.71-5.15 4.6 1.48 6.72L12 17.1l-6.08 3.19 1.48-6.72-5.15-4.6 6.85-.71z" />
              </svg>
              {{ item.c.reviewsCount > 0 ? scoreOf(item.c) : '—' }}
            </span>
          </div>

          <h3
            :class="[
              'mt-4 font-heading font-semibold text-foreground group-hover:text-primary transition-colors leading-tight',
              item.isLarge ? 'text-lg' : 'text-base',
            ]"
          >
            {{ item.c.name }}
          </h3>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ item.c.categoryName ?? 'Empresa' }}
            <span class="mx-1.5 text-muted-foreground/40">·</span>
            <span class="tabular-nums">{{ item.c.reviewsCount }}</span>
            {{ item.c.reviewsCount === 1 ? 'review' : 'reviews' }}
          </p>

          <div v-if="item.c.latestComment" class="mt-auto pt-4 border-t border-black/5">
            <div class="rounded-r-xl bg-primary/10 border-l-4 border-primary p-3">
              <div class="flex items-center gap-1.5">
                <svg class="text-primary shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span class="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Última review
                </span>
                <span class="ml-auto text-[11px] font-medium text-muted-foreground/60">
                  {{ timeAgo(item.c.latestCommentDate) }}
                </span>
              </div>
              <p :class="['mt-1.5 text-sm text-muted-foreground leading-relaxed', item.isLarge ? 'line-clamp-4' : 'line-clamp-3']">
                {{ item.c.latestComment }}
              </p>
            </div>
          </div>

          <div v-else class="mt-auto pt-4 border-t border-black/5">
            <div class="rounded-r-xl bg-tertiary-fixed/50 border-l-4 border-dashed border-tertiary/30 p-3">
              <span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Sin reviews todavía
              </span>
              <a
                :href="`/reviews/new?company=${item.c.slug}`"
                class="relative z-10 pointer-events-auto mt-1.5 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Sé el primero en opinar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-16">
      <p class="text-muted-foreground font-medium">Ocurrió un error al cargar las empresas</p>
      <button :class="btnOutline" class="mt-6" @click="fetchFirstPage">Reintentar</button>
    </div>

    <!-- Empty -->
    <div v-else class="text-center py-16">
      <p class="text-muted-foreground font-medium">
        {{ q.trim() ? `No encontramos "${q.trim()}"` : activeCategory ? `No hay empresas en "${activeCategoryName}"` : 'Aún no hay empresas registradas' }}
      </p>
      <p class="text-sm text-muted-foreground/60 mt-1">
        {{ q.trim() ? 'Prueba con otro nombre o categoría' : activeCategory ? 'Prueba con otra categoría' : 'Sé el primero en agregar una' }}
      </p>
      <button v-if="hasFilters" :class="btnOutline" class="mt-6" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>

    <!-- Load more -->
    <div v-if="shown > 0 && !error" class="flex flex-col items-center mt-10 gap-3">
      <button
        v-if="hasMore"
        :class="btnOutline"
        :disabled="loadingMore"
        @click="loadMore"
      >
        <svg
          v-if="loadingMore"
          class="animate-spin -ml-1 mr-2 h-4 w-4"
          viewBox="0 0 24 24" fill="none"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ loadingMore ? 'Cargando…' : 'Cargar más empresas' }}
      </button>
      <p v-else-if="!loading" class="text-sm text-muted-foreground/60">
        No hay más empresas para mostrar
      </p>
    </div>
  </div>
</template>
