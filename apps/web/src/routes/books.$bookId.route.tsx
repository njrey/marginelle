import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'
import { BookProgressProvider } from '@/contexts/BookProgressContext'

export const Route = createFileRoute('/books/$bookId')({
  component: BookDetailLayout,
})

function BookDetailLayout() {
  const { bookId } = Route.useParams()

  return (
    <BookProgressProvider bookId={bookId}>
      <BookDetailContent />
    </BookProgressProvider>
  )
}

function BookDetailContent() {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        {book.author && <p className="text-muted-foreground">by {book.author}</p>}
      </div>

      <Outlet />
    </div>
  )
}
