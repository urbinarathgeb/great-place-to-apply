<script setup lang="ts">
import { ref, computed } from 'vue'

interface Company {
  id: string
  name: string
  slug: string
  categoryName: string | null
  reviewsCount: number
  avgScore: string
}

const props = defineProps<{ companies: Company[] }>()

const query = ref('')
const showDropdown = ref(false)
const selectedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return []
  return props.companies.filter((c) => {
    return c.name.toLowerCase().includes(q) ||
      (c.categoryName && c.categoryName.toLowerCase().includes(q))
  }).slice(0, 8)
})

function onInput() {
  showDropdown.value = true
  selectedIndex.value = -1
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0 && filtered.value[selectedIndex.value]) {
      navigate(filtered.value[selectedIndex.value].slug)
    } else if (query.value.trim()) {
      search(query.value.trim())
    }
  } else if (e.key === 'Escape') {
    showDropdown.value = false
  }
}

function select(slug: string) {
  navigate(slug)
}

function navigate(slug: string) {
  showDropdown.value = false
  window.location.href = `/companies/${slug}`
}

function search(q: string) {
  showDropdown.value = false
  window.location.href = `/companies?q=${encodeURIComponent(q)}`
}

function onBlur() {
  setTimeout(() => { showDropdown.value = false }, 200)
}

function onFocus() {
  if (query.value.trim()) showDropdown.value = true
}
</script>

<template>
  <div class="relative max-w-xl mx-auto">
    <div class="relative">
      <svg
        class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        placeholder="Buscar empresa..."
        class="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
        @focus="onFocus"
      />
    </div>

    <Transition name="dropdown">
      <div
        v-if="showDropdown && filtered.length > 0"
        class="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-card shadow-lg z-50 overflow-hidden"
      >
        <button
          v-for="(c, i) in filtered"
          :key="c.id"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted',
            i === selectedIndex ? 'bg-muted' : ''
          ]"
          @mousedown.prevent="select(c.slug)"
        >
          <div class="flex-1 min-w-0">
            <span class="font-medium text-foreground">{{ c.name }}</span>
            <span v-if="c.categoryName" class="ml-2 text-xs text-muted-foreground">{{ c.categoryName }}</span>
          </div>
          <span class="text-sm font-semibold tabular-nums text-accent shrink-0">{{ c.avgScore }}</span>
        </button>
      </div>
    </Transition>

    <p v-if="query.trim() && filtered.length === 0" class="mt-2 text-sm text-muted-foreground text-center">
      Sin resultados. Presiona Enter para buscar &ldquo;{{ query }}&rdquo;
    </p>
  </div>
</template>

<style>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
