import { createFileRoute, Link } from '@tanstack/react-router'
import { useNotes } from '@/hooks/use-notes'

export const Route = createFileRoute('/books/$bookId/notes/')({
  component: NotesListPage,
})

function NotesListPage() {
  const { bookId } = Route.useParams()
  const { data: notes, isLoading, error } = useNotes(bookId)

  if (isLoading) return <div>Loading notes...</div>
  if (error) return <div className="text-red-600">Error loading notes: {error.message}</div>

  if (!notes || notes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No notes yet for this book.</p>
        <p className="text-sm mt-2">Click "Create New Note" to add your first note.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Link
          key={note.id}
          to="/books/$bookId/notes/$noteId"
          params={{ bookId, noteId: note.id }}
          className="block border border-gray-300 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
                  {note.type}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
              </div>
              {note.content && (
                <p className="text-gray-600 text-sm line-clamp-3">{note.content}</p>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Created: {new Date(note.createdAt).toLocaleDateString()}
          </div>
        </Link>
      ))}
    </div>
  )
}
