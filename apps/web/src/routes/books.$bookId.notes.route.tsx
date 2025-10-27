import { Outlet, createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'

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
        <nav className="space-x-4">
          <Link
            to="/books/$bookId/notes/new"
            params={{ bookId: book.id }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Create New Note
          </Link>
          <Link
            to="/books/$bookId/notes/relationships/new"
            params={{ bookId: book.id }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Create Relationship
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
