import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useBooks } from '@/hooks/use-books'

export const Route = createFileRoute('/books/list')({
  component: BooksListPage,
})

function BooksListPage() {
  const { data, isLoading, error } = useBooks()

  if (isLoading) return <div>Loading books...</div>
  if (error) return <div>Error loading books: {error.message}</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Books</h2>
        <Button>
          <Link to="/books/new">Create New Book</Link>
        </Button>
      </div>
      <ul className="list-disc pl-6">
        {data?.map(book => (
          <li key={book.id}>
            <strong>{book.title}</strong>
            {book.author && <span> by {book.author}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
