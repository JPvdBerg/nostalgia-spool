import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// `base` MUST match the GitHub Pages repository name so that assets
// resolve correctly when served from https://JPvdBerg.github.io/nostalgia-spool/
export default defineConfig({
  plugins: [react()],
  base: '/nostalgia-spool/',
})
