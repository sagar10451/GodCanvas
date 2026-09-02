import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { canvasApiPlugin } from './vite-plugin-canvas-api.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), canvasApiPlugin()],
  assetsInclude: ['**/*.md'],
})
