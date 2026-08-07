import { ref, computed, onBeforeUnmount } from 'vue'
import { buildLayout, type MosaicCompany } from './mosaic'
import { timeAgo } from './timeAgo'

export interface DirectoryCategory {
  id: number
  name: string
  slug: string
}

export interface DirectoryCompany extends MosaicCompany {
  slug: string
  logoUrl: string | null
  categoryName: string | null
  categorySlug: string | null
  avgScore: string
  latestComment: string | null
  latestCommentDate: string | null
}

export interface DirectoryPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseCompanyDirectoryOptions {
  initialCompanies: DirectoryCompany[]
  initialPagination: DirectoryPagination
  categories: DirectoryCategory[]
  initialQ?: string
  initialCategory?: string
}

const LIMIT = 12

const chipActive =
  'inline-flex items-center rounded-full bg-primary text-white text-sm font-semibold px-4 py-2 transition-colors'
const chipIdle =
  'inline-flex items-center rounded-full bg-white/70 border border-white/60 text-muted-foreground text-sm font-medium px-4 py-2 transition-all hover:text-primary hover:border-primary/40'
const btnOutline =
  'inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 border border-primary/30 text-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50 h-11 px-8'

export function useCompanyDirectory(options: UseCompanyDirectoryOptions) {
  const companies = ref<DirectoryCompany[]>([...options.initialCompanies])
  const total = ref(options.initialPagination.total)
  const totalPages = ref(options.initialPagination.totalPages)
  const currentPage = ref(options.initialPagination.page)
  const q = ref(options.initialQ ?? '')
  const activeCategory = ref(options.initialCategory ?? '')
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let controller: AbortController | null = null

  const shown = computed(() => companies.value.length)
  const hasMore = computed(() => currentPage.value < totalPages.value)
  const hasFilters = computed(() => q.value.trim() !== '' || activeCategory.value !== '')

  const activeCategoryName = computed(
    () =>
      options.categories.find((c) => c.slug === activeCategory.value)?.name ??
      activeCategory.value,
  )

  const resultLabel = computed(() => {
    if (total.value === 0) return ''
    const noun = total.value === 1 ? 'empresa' : 'empresas'
    return `Mostrando ${shown.value} de ${total.value} ${noun}`
  })

  const layout = computed(() => buildLayout(companies.value))

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

  function scoreOf(c: DirectoryCompany) {
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

  onBeforeUnmount(() => {
    controller?.abort()
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return {
    companies,
    total,
    totalPages,
    currentPage,
    q,
    activeCategory,
    loading,
    loadingMore,
    error,
    shown,
    hasMore,
    hasFilters,
    activeCategoryName,
    resultLabel,
    layout,
    chipActive,
    chipIdle,
    btnOutline,
    scoreOf,
    initialsOf,
    timeAgo,
    onInput,
    onSearch,
    onKeydown,
    selectCategory,
    clearFilters,
    fetchFirstPage,
    loadMore,
  }
}
