import { createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables, type Note } from '@/livestore/schema'

export const Route = createFileRoute('/books/$bookId/notes/$noteId')({
  component: NoteDetailPage,
})

function NoteDetailPage() {
  const { bookId, noteId } = Route.useParams()
  const { store } = useStore()

  // Query the note
  const note$ = queryDb(
    () => tables.notes.where({ id: noteId, deletedAt: null }).first(),
    { label: `note-${noteId}` }
  )
  const note = store.useQuery(note$)

  // Query all notes for this book (to populate relationship data)
  const allNotes$ = queryDb(
    () => tables.notes.where({ bookId, deletedAt: null }),
    { label: `notes-for-book-${bookId}` }
  )
  const allNotes = store.useQuery(allNotes$)

  // Query relationships for this note
  const relationships$ = queryDb(
    () => tables.noteRelationships.where({ deletedAt: null }),
    { label: `relationships-for-note-${noteId}` }
  )
  const allRelationships = store.useQuery(relationships$)

  if (!note) return <div className="text-red-600">Note not found</div>

  // Filter relationships for this note and populate with note data
  const noteMap = new Map(allNotes?.map(n => [n.id, n]) || [])

  const outgoingRelationships = (allRelationships || [])
    .filter(r => r.fromNoteId === noteId)
    .map(r => ({ ...r, toNote: noteMap.get(r.toNoteId) }))
    .filter(r => r.toNote) as Array<typeof allRelationships[0] & { toNote: Note }>

  const incomingRelationships = (allRelationships || [])
    .filter(r => r.toNoteId === noteId)
    .map(r => ({ ...r, fromNote: noteMap.get(r.fromNoteId) }))
    .filter(r => r.fromNote) as Array<typeof allRelationships[0] & { fromNote: Note }>

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/books/$bookId/notes"
        params={{ bookId }}
        className="text-blue-600 hover:text-blue-800 underline text-sm"
      >
        ← Back to Notes
      </Link>

      {/* Note Details */}
      <div className="border border-gray-300 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded">
            {note.type}
          </span>
          <h2 className="text-2xl font-bold text-gray-900">{note.title}</h2>
        </div>

        {note.content && (
          <div className="text-gray-700 whitespace-pre-wrap">{note.content}</div>
        )}

        <div className="mt-4 text-xs text-gray-400">
          Created: {new Date(note.createdAt).toLocaleDateString()} |
          Updated: {new Date(note.updatedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Relationships Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Relationships</h3>

        {/* Outgoing Relationships */}
        {outgoingRelationships.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">From this note:</h4>
                <div className="space-y-2">
                  {outgoingRelationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium">{note.title}</span>
                        <span className="text-blue-600 font-semibold">→ {rel.relationshipType} →</span>
                        <Link
                          to="/books/$bookId/notes/$noteId"
                          params={{ bookId, noteId: rel.toNote.id }}
                          className="text-gray-900 font-medium hover:text-blue-600 underline"
                        >
                          {rel.toNote.title}
                        </Link>
                        <span className="text-xs text-gray-500">({rel.toNote.type})</span>
                      </div>
                      {rel.description && (
                        <p className="text-sm text-gray-600 mt-2">{rel.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incoming Relationships */}
            {incomingRelationships.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">To this note:</h4>
                <div className="space-y-2">
                  {incomingRelationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Link
                          to="/books/$bookId/notes/$noteId"
                          params={{ bookId, noteId: rel.fromNote.id }}
                          className="text-gray-900 font-medium hover:text-blue-600 underline"
                        >
                          {rel.fromNote.title}
                        </Link>
                        <span className="text-xs text-gray-500">({rel.fromNote.type})</span>
                        <span className="text-blue-600 font-semibold">→ {rel.relationshipType} →</span>
                        <span className="text-gray-600 font-medium">{note.title}</span>
                      </div>
                      {rel.description && (
                        <p className="text-sm text-gray-600 mt-2">{rel.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

        {/* No Relationships */}
        {outgoingRelationships.length === 0 && incomingRelationships.length === 0 && (
          <div className="text-gray-500 text-center py-4">
            No relationships yet for this note.
          </div>
        )}
      </div>
    </div>
  )
}
