import { Outlet, createFileRoute } from '@tanstack/react-router'
import { BookBreadcrumbs } from '@/components/BookBreadcrumbs'

export const Route = createFileRoute('/books')({
  component: BooksLayout,
})

function BooksLayout() {
  return (
    <div>
      <BookBreadcrumbs />
      <Outlet />
    </div>
  )
}
