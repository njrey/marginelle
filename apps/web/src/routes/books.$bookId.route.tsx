import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'

export const Route = createFileRoute('/books/$bookId')({
  component: BookDetailLayout,
})

function BookDetailLayout() {
  const { bookId } = Route.useParams()
  const { store } = useStore()

  // Query for a single book by ID from local SQLite
  const book$ = queryDb(
    () => tables.books.where({ id: bookId, deletedAt: null }).first(),
    { label: `book-${bookId}` }
  )

  const book = store.useQuery(book$)

  // Handle loading/not found states
  if (!book) {
    return <div>Book not found or loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        <nav className="space-x-4">
          <Link
            to="/books/list"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Books
          </Link>
          <Link
            to="/books/$bookId/notes"
            params={{ bookId: book.id }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Notes
          </Link>
        </nav>
      </div>
      {book.author && <p className="text-gray-600 mb-4">by {book.author}</p>}
      <Outlet />
    </div>
  )
}
