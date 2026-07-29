// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vue from '@astrojs/vue';
import vercel from '@astrojs/vercel';
import dbCheck from './src/integrations/db-check';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [vue({ devtools: false }), dbCheck()],
});