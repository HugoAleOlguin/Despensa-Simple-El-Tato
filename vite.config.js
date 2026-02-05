import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Exponer a la red (LAN)
    port: 5173,       // Puerto fijo
    strictPort: true, // Si está ocupado, fallar en vez de cambiarlo (evita errores de IP)
  }
})
