// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    vue()
  ],
  server: {
    port: 3000,  // Porta del frontend Vite

    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, 'server')
    }
  }
})