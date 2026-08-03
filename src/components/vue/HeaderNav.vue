<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

function close() {
  isOpen.value = false
}

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/companies', label: 'Empresas' },
]

const btnSm = 'inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 btn-gradient text-white shadow-[0_4px_14px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.4)] h-8 px-4'
const btnDefault = 'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 btn-gradient text-white shadow-[0_4px_14px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.4)] h-10 px-6'
</script>

<template>
  <!-- Desktop nav (siempre visible en md+) -->
  <nav class="hidden md:flex items-center gap-4">
    <a
      v-for="link in links"
      :key="link.href"
      :href="link.href"
      class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {{ link.label }}
    </a>
    <a :href="'/reviews/new'" :class="btnSm">Escribir review</a>
  </nav>

  <!-- Mobile hamburger (solo en <md) -->
  <button
    class="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    aria-label="Abrir menú"
    @click="isOpen = true"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  </button>

  <!-- Mobile panel overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 bg-black/50 md:hidden"
        @click="close"
      />
    </Transition>

    <Transition name="panel">
      <div
        v-if="isOpen"
        class="fixed right-0 top-0 z-50 h-full w-64 border-l bg-background flex flex-col md:hidden"
      >
        <button
          class="absolute right-4 top-4 inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar menú"
          @click="close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div class="flex flex-col gap-1 px-6 pb-6 pt-16">
          <a
            v-for="link in links"
            :key="link.href"
            :href="link.href"
            class="text-base font-medium text-foreground hover:text-accent transition-colors py-2"
            @click="close"
          >
            {{ link.label }}
          </a>

          <a
            :href="'/reviews/new'"
            :class="btnDefault"
            class="mt-3"
            @click="close"
          >
            Escribir review
          </a>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}
</style>
