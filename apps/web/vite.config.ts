import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import tailwind from "@tailwindcss/vite"
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwind(),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    proxy: {
      // Forward /api/* to Nest on port 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // If you did NOT set a global prefix in Nest, uncomment the next line:
        // rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
