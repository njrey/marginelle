import { createFileRoute, Link } from '@tanstack/react-router'
import { useNote } from '@/hooks/use-notes'
import { useRelationships } from '@/hooks/use-relationships'

export const Route = createFileRoute('/books/$bookId/notes/$noteId')({
  component: NoteDetailPage,
})

function NoteDetailPage() {
  const { bookId, noteId } = Route.useParams()
  const { data: note, isLoading: noteLoading, error: noteError } = useNote(bookId, noteId)
  const { data: relationships, isLoading: relationshipsLoading, error: relationshipsError } = useRelationships(bookId, noteId)

  if (noteLoading) return <div>Loading note...</div>
  if (noteError) return <div className="text-red-600">Error loading note: {noteError.message}</div>
  if (!note) return <div className="text-red-600">Note not found</div>

  // Separate relationships into outgoing (from this note) and incoming (to this note)
  const outgoingRelationships = relationships?.filter(r => r.fromNoteId === noteId) || []
  const incomingRelationships = relationships?.filter(r => r.toNoteId === noteId) || []

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

        {relationshipsLoading && <div>Loading relationships...</div>}
        {relationshipsError && <div className="text-red-600">Error loading relationships: {relationshipsError.message}</div>}

        {!relationshipsLoading && !relationshipsError && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
