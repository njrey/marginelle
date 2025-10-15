import { createFileRoute } from '@tanstack/react-router'
import { NoteForm } from '@/components/forms/NoteForm'

export const Route = createFileRoute('/books/$bookId/notes/new')({
  component: NewNotePage,
})

function NewNotePage() {
  const { bookId } = Route.useParams()

  return (
    <div>
      <NoteForm bookId={bookId} />
    </div>
  )
}
