import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'

export const Route = createFileRoute('/books/$bookId/')({
  component: BookDetailIndexPage,
})

function BookDetailIndexPage() {
  const { bookId } = Route.useParams()
  const { store } = useStore()

  // Query the same book - LiveStore will reuse the reactive query from parent
  const book$ = queryDb(
    () => tables.books.where({ id: bookId, deletedAt: null }).first(),
    { label: `book-${bookId}` }
  )

  const book = store.useQuery(book$)

  if (!book) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <p className="text-gray-600">You are viewing details for "{book.title}"</p>
      {book.author && <p className="text-gray-600">Written by {book.author}</p>}
      <p className="text-gray-600 mt-4">Click "Notes" in the navigation to view notes for this book.</p>
    </div>
  )
}
