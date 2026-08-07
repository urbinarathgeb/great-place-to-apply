<script setup lang="ts">
import {
  useCompanyDirectory,
  type DirectoryCategory,
  type DirectoryCompany,
  type DirectoryPagination,
} from '@/lib/useCompanyDirectory'

const props = defineProps<{
  companies: DirectoryCompany[]
  pagination: DirectoryPagination
  categories: DirectoryCategory[]
  initialQ?: string
  initialCategory?: string
}>()

const {
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
} = useCompanyDirectory({
  initialCompanies: props.companies,
  initialPagination: props.pagination,
  categories: props.categories,
  initialQ: props.initialQ,
  initialCategory: props.initialCategory,
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
      <p class="text-sm text-muted-foreground font-medium" role="status" aria-live="polite">
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
      :aria-busy="loading ? 'true' : 'false'"
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
    <div v-else-if="error" class="text-center py-16" role="alert">
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
