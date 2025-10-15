import { createFileRoute } from '@tanstack/react-router'
import { RelationshipForm } from '@/components/forms/RelationshipForm'

export const Route = createFileRoute('/books/$bookId/notes/relationships/new')({
  component: NewRelationshipPage,
})

function NewRelationshipPage() {
  const { bookId } = Route.useParams()

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Create Relationship</h3>
      <RelationshipForm bookId={bookId} />
    </div>
  )
}
