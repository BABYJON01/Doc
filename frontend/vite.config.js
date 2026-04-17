import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {

    target: 'esnext' // Essential for libraries like pdfjs-dist
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
})

