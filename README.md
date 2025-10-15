# Marginelle
Book-notes app to help readers keep track of characters, events, organizations, and relationships
## Reasoning
This app is mostly a place to learn some technologies that I'm not as familiar with. As a full stack developer, I work daily with front-end frameworks and api frameworks. I have the opportunity to work with Python (FastAPI) quite often, and for front-end, I've used react router and NextJS. I'm hoping this project will give me the opportunity to explore some new technologies
### Tanstack
I haven't used these tools professionally, but I appreciate the way Tanstack approaches front-end code. Their tools feel more composable and lightweight as opposed to something like NextJS. 
#### Tanstack/React Query
I've used useSWR to handle more complex data fetching and caching in the, so I'm excited to try out another data-fetching library. I'm already noticing many similarities, but I do feel like the Tanstack Query API is more intuitive. 
#### Tanstack Router
I've used React Router and NextJS in the past, so Tanstack Router will be new for me. I think I'm already addicted to the concept of **type-safe routing**. 
### NestJS
I've used several backend languages (Java, PHP, Python), and many different API frameworks. Currently I've been enjoying FastAPI. I would like to get more experience with the Node ecosystem, so I decided on NestJS. I was torn between NestJS and Hono since Hono is so lightweight. In the end, I went with NestJS since it seems to be a commonly used enterprise solution.
### Drizzle ORM
I've heard a lot of discussion around Prisma and Drizzle. Though Prisma seems to have a larger community, I'd like to try out Drizzle since I like the query syntax and the docs seem well-organized.
### SQLite
I have always used Postgres in my professional career. I know it's a bit heavier but I feel like it's often talked about as one of the most scalable options. Even for hobby projects, I always used Postgres since I was already familiar with it. Now that I've used SQLite, I can see why people choose it. It seems to handle everything Postgres handles, and it's been extremely easy to interact with the database and back things up. Eventually, I may have use of Postgres's scalability, but for a small project, SQLite has been great.
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
