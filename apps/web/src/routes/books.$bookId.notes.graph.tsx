import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'
import { useBookProgress } from '@/contexts/BookProgressContext'
import { CharacterGraph } from '@/components/graph/CharacterGraph'

export const Route = createFileRoute('/books/$bookId/notes/graph')({
  component: GraphViewPage,
})

function GraphViewPage() {
  const { bookId } = Route.useParams()
  const { store } = useStore()
  const { currentPage } = useBookProgress()
  const navigate = useNavigate()

  // Query all notes for book
  const notes$ = queryDb(
    () => tables.notes.where({ bookId, deletedAt: null }),
    { label: `notes-for-book-${bookId}` }
  )
  const allNotes = store.useQuery(notes$)

  // Query all relationships
  const relationships$ = queryDb(
    () => tables.noteRelationships.where({ deletedAt: null }),
    { label: `relationships-all` }
  )
  const allRelationships = store.useQuery(relationships$)

  // 1. Filter for character notes only
  const characterNotes = (allNotes || []).filter(note => note.type === 'character')

  // 2. Apply temporal filtering (reading progress)
  const visibleCharacters = currentPage
    ? characterNotes.filter(note => note.pageNumber <= currentPage)
    : characterNotes

  // 3. Filter for 'friend' relationships only + temporal filter
  const friendRelationships = (allRelationships || [])
    .filter(r => r.relationshipType === 'friend')
    .filter(r => currentPage ? r.pageNumber <= currentPage : true)

  // 4. Filter edges where BOTH nodes are visible
  const visibleCharacterIds = new Set(visibleCharacters.map(c => c.id))
  const visibleEdges = friendRelationships.filter(edge =>
    visibleCharacterIds.has(edge.fromNoteId) && visibleCharacterIds.has(edge.toNoteId)
  )

  // 5. Transform to graph format
  const nodes = visibleCharacters.map(note => ({
    id: note.id,
    label: note.title,
    pageNumber: note.pageNumber,
  }))

  const edges = visibleEdges.map(rel => ({
    source: rel.fromNoteId,
    target: rel.toNoteId,
    pageNumber: rel.pageNumber,
  }))
  console.log(edges)

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    navigate({
      to: '/books/$bookId/notes/$noteId',
      params: { bookId, noteId: nodeId }
    })
  }

  // No characters at all
  if (characterNotes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No character notes yet for this book.</p>
        <p className="text-sm mt-2">Create character notes to see the relationship graph.</p>
      </div>
    )
  }

  // Characters exist but none visible at current page
  if (currentPage && visibleCharacters.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No characters discovered yet at page {currentPage}.</p>
        <p className="text-sm mt-2">Total characters in book: {characterNotes.length}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Temporal filtering indicator */}
      {currentPage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <p className="text-green-800">
            Showing {nodes.length} character{nodes.length !== 1 ? 's' : ''} and {edges.length} friendship{edges.length !== 1 ? 's' : ''} discovered by page {currentPage}
          </p>
        </div>
      )}

      <CharacterGraph
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
      />
    </div>
  )
}
