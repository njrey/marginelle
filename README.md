# Marginelle
Book-notes app to help readers keep track of characters, events, organizations, and relationships
## Reasoning
This app is mostly a place to learn some technologies that I'm not as familiar with. As a full stack developer, I work daily with front-end frameworks and api frameworks. I have the opportunity to work with Python (FastAPI) quite often, and for front-end, I've used react router and NextJS. I'm hoping this project will give me the opportunity to explore some new technologies
### Tanstack Router
I've used React Router and NextJS in the past, so Tanstack Router will be new for me. I think I'm already addicted to the concept of **type-safe routing**.
### LiveStore
I'm migrating to LiveStore to explore local-first architecture and event sourcing. LiveStore provides offline-first reactive state management with SQLite, automatic sync across devices/tabs, and a CQRS event-sourced pattern. This eliminates much of the traditional backend API layer and moves state management to the edge.
### SQLite
I have always used Postgres in my professional career. I know it's a bit heavier but I feel like it's often talked about as one of the most scalable options. Even for hobby projects, I always used Postgres since I was already familiar with it. Now that I've used SQLite, I can see why people choose it. It seems to handle everything Postgres handles, and it's been extremely easy to interact with the database and back things up. Eventually, I may have use of Postgres's scalability, but for a small project, SQLite has been great.
## Tooling
### Frontend
- React
- Tanstack Router
- LiveStore (local-first state management with SQLite)
- Effect (functional programming library)
- Tailwind v4
- shadcn/ui
- Vite
### Backend
- Cloudflare Workers (LiveStore sync server with Durable Objects)
- Wrangler (Cloudflare dev tools)
- D1 (Cloudflare's SQLite database)
- NestJS (Fastify) - being phased out in favor of LiveStore
### Tooling
- pnpm
- Turborepo
- prettier
## Repo Structure 
```
marginelle/
|- apps/
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

### Frontend (apps/web/.env)
```bash
# LiveStore Sync Configuration

# Local development: Points to local Wrangler dev server
VITE_LIVESTORE_SYNC_URL=http://localhost:8787

# Production: Replace with deployed Cloudflare Worker URL
# VITE_LIVESTORE_SYNC_URL=https://your-worker.your-subdomain.workers.dev
```

**Local vs Production:**
- **Local development**: Uses `http://localhost:8787` to sync with Wrangler dev server running locally
  - Data persists in browser OPFS (Origin Private File System)
  - Sync happens between browser tabs and to local D1 database
  - Wrangler starts automatically when you run `pnpm dev` (see vite.config.ts)

- **Production**: Update to your deployed Cloudflare Worker URL
  - Deploy with `wrangler deploy` from apps/web directory
  - Data syncs to production D1 database
  - Real-time sync across devices and users

### Backend (apps/api/.env) - Legacy, being phased out
```bash
DATABASE_SQLITE_PATH=./data/dev.db
# add other env as needed later
```
Create the data/ folder if it doesn't exist:
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
