import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <header className="p-4 border-b">Marginelle</header>
      <main className="p-4"><Outlet /></main>
    </div>
  ),
})
