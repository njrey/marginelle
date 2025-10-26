/* eslint-disable unicorn/no-process-exit */
import { spawn } from 'node:child_process'
import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'

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
    livestoreDevtoolsPlugin({ schemaPath: './src/livestore/schema.ts' }),

    // Running `wrangler dev` as part of `vite dev` needed for `@livestore/sync-cf`
    {
      name: 'wrangler-dev',
      configureServer: async (server) => {
        const wrangler = spawn('./node_modules/.bin/wrangler', ['dev', '--port', '8787'], {
          stdio: ['ignore', 'inherit', 'inherit'],
        })

        const shutdown = () => {
          if (wrangler.killed === false) {
            wrangler.kill()
          }
          process.exit(0)
        }

        server.httpServer?.on('close', shutdown)
        process.on('SIGTERM', shutdown)
        process.on('SIGINT', shutdown)

        wrangler.on('exit', (code) => console.error(`wrangler dev exited with code ${code}`))
      },
    },
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 60_001,
  },
  worker: { format: 'es' },
  optimizeDeps: {
    exclude: [
      '@livestore/wa-sqlite',
      '@livestore/adapter-web',
      '@livestore/sync-cf',
    ],
  },
  ssr: {
    noExternal: ['@livestore/wa-sqlite'],
  },
})
