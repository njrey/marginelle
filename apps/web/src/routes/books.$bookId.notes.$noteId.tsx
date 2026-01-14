import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables, events, type Note } from '@/livestore/schema'
import { useBookProgress } from '@/contexts/BookProgressContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/books/$bookId/notes/$noteId')({
  component: NoteDetailPage,
})

function NoteDetailPage() {
  const { bookId, noteId } = Route.useParams()
  const { store } = useStore()
  const { currentPage } = useBookProgress()
  const navigate = useNavigate()

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

  const handleDeleteNote = () => {
    if (!confirm(`Delete note "${note?.title}"? This cannot be undone.`)) {
      return
    }

    const now = new Date()

    // Delete relationships involving this note
    for (const rel of allRelationships || []) {
      if (rel.fromNoteId === noteId || rel.toNoteId === noteId) {
        store.commit(events.relationshipDeleted({ id: rel.id, deletedAt: now }))
      }
    }

    // Delete the note
    store.commit(events.noteDeleted({ id: noteId, deletedAt: now }))

    navigate({ to: '/books/$bookId/notes', params: { bookId } })
  }

  const handleDeleteRelationship = (relId: string) => {
    if (!confirm('Delete this relationship? This cannot be undone.')) {
      return
    }

    store.commit(events.relationshipDeleted({ id: relId, deletedAt: new Date() }))
  }

  if (!note) return <div className="text-red-600">Note not found</div>

  // Check if note is visible at current page
  const noteVisible = !currentPage || note.pageNumber <= currentPage

  if (!noteVisible) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>This note hasn't been discovered yet at page {currentPage}.</p>
        <p className="text-sm mt-2">Note appears on page {note.pageNumber}</p>
      </div>
    )
  }

  // Filter relationships for this note and populate with note data
  const noteMap = new Map(allNotes?.map(n => [n.id, n]) || [])

  // Filter relationships by current page
  const visibleRelationships = currentPage
    ? (allRelationships || []).filter(r => r.pageNumber <= currentPage)
    : (allRelationships || [])

  const outgoingRelationships = visibleRelationships
    .filter(r => r.fromNoteId === noteId)
    .map(r => ({ ...r, toNote: noteMap.get(r.toNoteId) }))
    .filter(r => r.toNote && (!currentPage || r.toNote.pageNumber <= currentPage))
    .sort((a, b) => a.pageNumber - b.pageNumber) as Array<typeof allRelationships[0] & { toNote: Note }>

  const incomingRelationships = visibleRelationships
    .filter(r => r.toNoteId === noteId)
    .map(r => ({ ...r, fromNote: noteMap.get(r.fromNoteId) }))
    .filter(r => r.fromNote && (!currentPage || r.fromNote.pageNumber <= currentPage))
    .sort((a, b) => a.pageNumber - b.pageNumber) as Array<typeof allRelationships[0] & { fromNote: Note }>

  // Group relationships by note pair to show history
  const groupOutgoingByPair = (rels: typeof outgoingRelationships) => {
    const grouped = new Map<string, typeof outgoingRelationships>()
    rels.forEach(rel => {
      const key = `${rel.fromNoteId}-${rel.toNoteId}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(rel)
    })
    return Array.from(grouped.values())
  }

  const groupIncomingByPair = (rels: typeof incomingRelationships) => {
    const grouped = new Map<string, typeof incomingRelationships>()
    rels.forEach(rel => {
      const key = `${rel.fromNoteId}-${rel.toNoteId}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(rel)
    })
    return Array.from(grouped.values())
  }

  const groupedOutgoing = groupOutgoingByPair(outgoingRelationships)
  const groupedIncoming = groupIncomingByPair(incomingRelationships)

  return (
    <div className="space-y-6">
      {/* Back link and actions */}
      <div className="flex justify-between items-center">
        <Link
          to="/books/$bookId/notes"
          params={{ bookId }}
          className="text-blue-600 hover:text-blue-800 underline text-sm"
        >
          ← Back to Notes
        </Link>
        <Button variant="destructive" size="sm" onClick={handleDeleteNote}>
          Delete Note
        </Button>
      </div>

      {/* Note Details */}
      <div className="border border-gray-300 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">{note.type}</Badge>
          <Badge variant="outline">Discovered: p.{note.pageNumber}</Badge>
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
        {groupedOutgoing.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">From this note:</h4>
            <div className="space-y-3">
              {groupedOutgoing.map((relGroup, idx) => {
                const latestRel = relGroup[relGroup.length - 1]
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-600 font-medium">{note.title}</span>
                      <span className="text-blue-600 font-semibold">→</span>
                      <Link
                        to="/books/$bookId/notes/$noteId"
                        params={{ bookId, noteId: latestRel.toNote.id }}
                        className="text-gray-900 font-medium hover:text-blue-600 underline"
                      >
                        {latestRel.toNote.title}
                      </Link>
                      <span className="text-xs text-gray-500">({latestRel.toNote.type})</span>
                    </div>

                    {/* Relationship History Timeline */}
                    <div className="mt-3 space-y-1">
                      {relGroup.map((rel, relIdx) => (
                        <div key={rel.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">p.{rel.pageNumber}</Badge>
                          <span className={`font-medium ${relIdx === relGroup.length - 1 ? 'text-blue-700' : 'text-gray-500'}`}>
                            {rel.relationshipType}
                          </span>
                          {rel.description && (
                            <span className="text-gray-600 text-xs italic">"{rel.description}"</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteRelationship(rel.id)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>

                    {relGroup.length > 1 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Relationship evolved {relGroup.length} times
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Incoming Relationships */}
        {groupedIncoming.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">To this note:</h4>
            <div className="space-y-3">
              {groupedIncoming.map((relGroup, idx) => {
                const latestRel = relGroup[relGroup.length - 1]
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        to="/books/$bookId/notes/$noteId"
                        params={{ bookId, noteId: latestRel.fromNote.id }}
                        className="text-gray-900 font-medium hover:text-blue-600 underline"
                      >
                        {latestRel.fromNote.title}
                      </Link>
                      <span className="text-xs text-gray-500">({latestRel.fromNote.type})</span>
                      <span className="text-blue-600 font-semibold">→</span>
                      <span className="text-gray-600 font-medium">{note.title}</span>
                    </div>

                    {/* Relationship History Timeline */}
                    <div className="mt-3 space-y-1">
                      {relGroup.map((rel, relIdx) => (
                        <div key={rel.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">p.{rel.pageNumber}</Badge>
                          <span className={`font-medium ${relIdx === relGroup.length - 1 ? 'text-blue-700' : 'text-gray-500'}`}>
                            {rel.relationshipType}
                          </span>
                          {rel.description && (
                            <span className="text-gray-600 text-xs italic">"{rel.description}"</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteRelationship(rel.id)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>

                    {relGroup.length > 1 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Relationship evolved {relGroup.length} times
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Relationships */}
        {groupedOutgoing.length === 0 && groupedIncoming.length === 0 && (
          <div className="text-gray-500 text-center py-4">
            {currentPage
              ? `No relationships discovered yet at page ${currentPage}.`
              : 'No relationships yet for this note.'}
          </div>
        )}
      </div>
    </div>
  )
}
