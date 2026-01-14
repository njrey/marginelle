import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables, events } from '@/livestore/schema'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/books/$bookId/')({
  component: BookDetailIndexPage,
})

function BookDetailIndexPage() {
  const { bookId } = Route.useParams()
  const { store } = useStore()
  const navigate = useNavigate()

  // Query the same book - LiveStore will reuse the reactive query from parent
  const book$ = queryDb(
    () => tables.books.where({ id: bookId, deletedAt: null }).first(),
    { label: `book-${bookId}` }
  )

  // Query notes for cascade delete
  const notes$ = queryDb(
    () => tables.notes.where({ bookId, deletedAt: null }),
    { label: `book-${bookId}-notes-for-delete` }
  )

  // Query all relationships for cascade delete
  const relationships$ = queryDb(
    () => tables.noteRelationships.where({ deletedAt: null }),
    { label: `relationships-for-delete` }
  )

  const book = store.useQuery(book$)
  const notes = store.useQuery(notes$)
  const relationships = store.useQuery(relationships$)

  const handleDelete = () => {
    if (!confirm(`Delete "${book?.title}" and all its notes? This cannot be undone.`)) {
      return
    }

    const now = new Date()
    const noteIds = new Set(notes.map((n) => n.id))

    // Delete relationships involving this book's notes
    for (const rel of relationships) {
      if (noteIds.has(rel.fromNoteId) || noteIds.has(rel.toNoteId)) {
        store.commit(events.relationshipDeleted({ id: rel.id, deletedAt: now }))
      }
    }

    // Delete all notes for this book
    for (const note of notes) {
      store.commit(events.noteDeleted({ id: note.id, deletedAt: now }))
    }

    // Delete the book
    store.commit(events.bookDeleted({ id: bookId, deletedAt: now }))

    navigate({ to: '/books/list' })
  }

  if (!book) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <p className="text-gray-600">You are viewing details for "{book.title}"</p>
      {book.author && <p className="text-gray-600">Written by {book.author}</p>}
      <div className="mt-4 flex gap-2">
        <Button asChild>
          <Link to="/books/$bookId/notes" params={{ bookId }}>
            View Notes
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/books/$bookId/graph" params={{ bookId }}>
            Character Graph
          </Link>
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Book
        </Button>
      </div>
    </div>
  )
}
