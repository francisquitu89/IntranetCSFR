import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    configureServer: (server) => {
      return () => {
        server.middlewares.use((req, res, next) => {
          // Redirigir rutas SPA a index.html
          if (req.method === 'GET' && 
              !req.url.startsWith('/api') &&
              !req.url.startsWith('/@') &&
              !req.url.includes('.') &&
              req.url !== '/') {
            req.url = '/'
          }
          next()
        })
      }
    }
  },
  preview: {
    port: 4173,
  },
})
