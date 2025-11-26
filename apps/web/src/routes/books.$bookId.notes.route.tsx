import { Outlet, createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/books/$bookId/notes')({
  component: NotesLayout,
})

function NotesLayout() {
  const { bookId } = Route.useParams()
  const { store } = useStore()

  const book$ = queryDb(
    () => tables.books.where({ id: bookId, deletedAt: null }).first(),
    { label: `book-${bookId}` }
  )
  const book = store.useQuery(book$)

  if (!book) {
    return <div>Book not found or loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notes for "{book.title}"</h2>
        <div className="flex gap-2">
          <Button asChild>
            <Link
              to="/books/$bookId/notes/new"
              params={{ bookId: book.id }}
            >
              Create New Note
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              to="/books/$bookId/notes/relationships/new"
              params={{ bookId: book.id }}
            >
              Create Relationship
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              to="/books/$bookId/notes/graph"
              params={{ bookId: book.id }}
            >
              Graph View
            </Link>
          </Button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
