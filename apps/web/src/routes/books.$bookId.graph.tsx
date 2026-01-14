import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'
import { useBookProgress } from '@/contexts/BookProgressContext'
import { CharacterGraph } from '@/components/graph/CharacterGraph'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useState } from 'react'

export const Route = createFileRoute('/books/$bookId/graph')({
  component: GraphViewPage,
})

function GraphViewPage() {
  const { bookId } = Route.useParams()
  const { store } = useStore()
  const { currentPage, setCurrentPage, maxPage } = useBookProgress()
  const navigate = useNavigate()
  const [sliderValue, setSliderValue] = useState<number[]>([currentPage || 1])

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

  // 1. Filter for character and organization notes
  const characterNotes = (allNotes || []).filter(note => note.type === 'character')
  const organizationNotes = (allNotes || []).filter(note => note.type === 'organization')

  // 2. Apply temporal filtering (reading progress)
  const visibleCharacters = currentPage
    ? characterNotes.filter(note => note.pageNumber <= currentPage)
    : characterNotes

  const visibleOrganizations = currentPage
    ? organizationNotes.filter(note => note.pageNumber <= currentPage)
    : organizationNotes

  // 3. Filter for 'friend' relationships only + temporal filter
  const friendRelationships = (allRelationships || [])
    .filter(r => r.relationshipType === 'friend')
    .filter(r => currentPage ? r.pageNumber <= currentPage : true)

  // 4. Filter for 'member_of' relationships + temporal filter
  const memberOfRelationships = (allRelationships || [])
    .filter(r => r.relationshipType === 'member_of')
    .filter(r => currentPage ? r.pageNumber <= currentPage : true)

  // 4b. Filter for org-to-org relationships (ally/enemy) + temporal filter
  const orgToOrgRelationships = (allRelationships || [])
    .filter(r => r.relationshipType === 'ally' || r.relationshipType === 'enemy')
    .filter(r => currentPage ? r.pageNumber <= currentPage : true)

  // 5. Filter edges where BOTH nodes are visible
  const visibleCharacterIds = new Set(visibleCharacters.map(c => c.id))
  const visibleEdges = friendRelationships.filter(edge =>
    visibleCharacterIds.has(edge.fromNoteId) && visibleCharacterIds.has(edge.toNoteId)
  )

  // 6. Build organization groups with member lists
  //const visibleOrgIds = new Set(visibleOrganizations.map(o => o.id))
  const organizationGroups = visibleOrganizations.map((org, index) => {
    // Find all member_of relationships pointing to this organization
    const memberIds = memberOfRelationships
      .filter(r => r.toNoteId === org.id && visibleCharacterIds.has(r.fromNoteId))
      .map(r => r.fromNoteId)

    // Generate a color for this organization
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ef4444', // red
      '#06b6d4', // cyan
      '#ec4899', // pink
    ]

    return {
      id: org.id,
      name: org.title,
      memberIds,
      pageNumber: org.pageNumber,
      color: colors[index % colors.length],
    }
  }).filter(org => org.memberIds.length >= 2) // Only show orgs with 2+ members

  // 6b. Build org-to-org links (only between visible orgs)
  const visibleOrgGroupIds = new Set(organizationGroups.map(o => o.id))
  const orgLinks = orgToOrgRelationships
    .filter(r => visibleOrgGroupIds.has(r.fromNoteId) && visibleOrgGroupIds.has(r.toNoteId))
    .map(r => ({
      sourceOrgId: r.fromNoteId,
      targetOrgId: r.toNoteId,
      relationshipType: r.relationshipType as 'ally' | 'enemy',
      pageNumber: r.pageNumber,
    }))

  // 7. Transform to graph format
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

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    navigate({
      to: '/books/$bookId/notes/$noteId',
      params: { bookId, noteId: nodeId }
    })
  }

  // Handle slider for progress
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value)
  }

  const handleSliderCommit = (value: number[]) => {
    const roundedPage = Math.round(value[0])
    setSliderValue([roundedPage])
    setCurrentPage(roundedPage)
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
      {/* Character Graph - Main Focus */}
      <div className="space-y-4">
        {/* Temporal filtering indicator */}
        {currentPage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="text-green-800">
              Showing {nodes.length} character{nodes.length !== 1 ? 's' : ''}, {edges.length} friendship{edges.length !== 1 ? 's' : ''}, and {organizationGroups.length} organization{organizationGroups.length !== 1 ? 's' : ''} discovered by page {currentPage}
            </p>
          </div>
        )}

        <CharacterGraph
          nodes={nodes}
          edges={edges}
          organizations={organizationGroups}
          orgLinks={orgLinks}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Reading Progress Control - Below Graph */}
      <Card className="bg-accent/10 border-accent/30">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Reading Progress</CardTitle>
            <div className="text-sm text-muted-foreground">
              {currentPage ? (
                <span>Page <strong>{Math.round(sliderValue[0])}</strong> {Math.round(sliderValue[0]) !== currentPage && '(drag to update)'}</span>
              ) : (
                <span>Set your reading progress</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-8">1</span>
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              min={1}
              max={maxPage || 100}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12">{maxPage || '?'}</span>
          </div>

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Start of book</span>
            {maxPage && (
              <button
                onClick={() => {
                  setSliderValue([maxPage])
                  setCurrentPage(maxPage)
                }}
                className="text-primary hover:text-primary/80 underline"
              >
                Jump to Latest (p.{maxPage})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - At Bottom */}
      <div className="flex gap-2 justify-end">
        <Button asChild variant="outline">
          <Link
            to="/books/$bookId/notes"
            params={{ bookId }}
          >
            Back to Notes
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            to="/books/$bookId/notes/new"
            params={{ bookId }}
          >
            Create New Note
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            to="/books/$bookId/notes/relationships/new"
            params={{ bookId }}
          >
            Create Relationship
          </Link>
        </Button>
      </div>
    </div>
  )
}
