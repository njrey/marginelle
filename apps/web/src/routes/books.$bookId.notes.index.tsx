import { createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'
import { useBookProgress } from '@/contexts/BookProgressContext'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

export const Route = createFileRoute('/books/$bookId/notes/')({
  component: NotesListPage,
})

function NotesListPage() {
  const { bookId } = Route.useParams()
  const { store } = useStore()
  const { currentPage } = useBookProgress()

  const notes$ = queryDb(
    () => tables.notes.where({ bookId, deletedAt: null }),
    { label: `notes-for-book-${bookId}` }
  )
  const allNotes = store.useQuery(notes$)
  const allNotesMutable = [...allNotes]

  // Filter notes by current page progress
  const notes = currentPage
    ? allNotesMutable?.filter(note => note.pageNumber <= currentPage).sort((a, b) => a.pageNumber - b.pageNumber)
    : allNotesMutable?.sort((a, b) => a.pageNumber - b.pageNumber)

  const totalNotes = allNotes?.length || 0
  const visibleNotes = notes?.length || 0

  if (!allNotes || allNotes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No notes yet for this book.</p>
        <p className="text-sm mt-2">Click "Create New Note" to add your first note.</p>
      </div>
    )
  }

  if (currentPage && visibleNotes === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No notes discovered yet at page {currentPage}.</p>
        <p className="text-sm mt-2">Total notes in book: {totalNotes}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Temporal filtering indicator */}
      {currentPage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <p className="text-green-800">
            Showing {visibleNotes} of {totalNotes} notes discovered by page {currentPage}
          </p>
        </div>
      )}

      {notes.map((note) => (
        <Link
          key={note.id}
          to="/books/$bookId/notes/$noteId"
          params={{ bookId, noteId: note.id }}
          className="block hover:shadow-lg transition-shadow"
        >
          <Card className="hover:border-blue-400 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{note.type}</Badge>
                <Badge variant="outline">p.{note.pageNumber}</Badge>
              </div>
              <CardTitle className="text-lg">{note.title}</CardTitle>
            </CardHeader>
            {note.content && (
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3">{note.content}</p>
              </CardContent>
            )}
            <CardFooter>
              <span className="text-xs text-muted-foreground">
                Created: {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
