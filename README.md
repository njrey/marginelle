# Marginelle
Book-notes app to help readers keep track of characters, events, organizations, and relationships
## Tooling
### Frontend
- React
- Tanstack- Router, Query
- Tailwind v4
- shadcn/ui
- Vite
### Backend
- NestJS (Fastify)
- Drizzle ORM + SQLite
### Tooling
- pnpm
- Turborepo
- prettier
## Repo Structure 
```
marginelle/
|- apps/
|   |- api/
|   |   |- api/
|   |   |- data/
|   |- web/
|   |   |- src/
|   |   |   |- routes/
|   |   |   |- index.css 
|   |   |   |- routeTree.gen.ts (generated)
|- pnpm-workspace.yaml
|- turbo.json 
|- tsconfig.base.json 
|- readme.md 
```
## Prereqs
- Node.js LTS
- pnpm 

## Install
```
pnpm install
```

## Environment

apps/api/.env
```
DATABASE_SQLITE_PATH=./data/dev.db
# add other env as needed later
```
Create the data/ folder if it doesn’t exist:
`mkdir -p apps/api/data`

## Scripts
### Root
```
pnpm dev            # run api + web in parallel (watch mode)
pnpm build          # build everything in correct dependency order
pnpm typecheck      # typecheck all packages/apps
pnpm lint           # lint across the monorepo
pnpm format         # prettier write
pnpm format:check   # prettier check
```
### DB
```
pnpm db:generate    # generate Drizzle migrations from schema
pnpm db:migrate     # apply migrations to the dev DB
pnpm db:seed        # seed sample data
pnpm db:studio      # open Drizzle Studio UI
```
### Per-app
```
pnpm --filter api dev      # just the API
pnpm --filter web dev      # just the web app
pnpm --filter @marginelle/db build   # build the db package (generates dist/)
```
## Running the app for dev
1. DB setup
```
pnpm db:generate
pnpm db:migrate
```
2. Start backend and front-end
```
pnpm dev
```

## Notes
### Proxy
For dev, we have a proxy (`app/web/vite.config.ts`) to prevent cors issues:
```
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      // If you remove the API's global prefix, add:
      // rewrite: (p) => p.replace(/^\/api/, ''),
    },
  },
},
```
