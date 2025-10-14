import { createFileRoute } from '@tanstack/react-router'
import { BookForm } from '@/components/forms/BookForm'

export const Route = createFileRoute('/books/new')({
  component: NewBookPage,
})

function NewBookPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Create New Book</h2>
      <BookForm />
    </div>
  )
}

