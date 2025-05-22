// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'       // se usi React: import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    vue()
  ],
  server: {
    // porta su cui gira il dev-server di Vite (front-end)
    port: 3000,

    // tutte le chiamate a /api/* vengono proxate al tuo Express back-end in esecuzione su localhost:10000
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '/api')
      }
    }
  },
  resolve: {
    alias: {
      // se in front-end ti serve importare moduli da server/
      '@server': path.resolve(__dirname, 'server')
    }
  }
})