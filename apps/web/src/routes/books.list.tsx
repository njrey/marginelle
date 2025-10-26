import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { tables } from '@/livestore/schema'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'

export const Route = createFileRoute('/books/list')({
  component: BooksListPage,
})

const books$ = queryDb(
  () => {
    return tables.books.where({
      deletedAt: null,
    })
  },
  { label: 'visibleTodos' },
)
function BooksListPage() {

  const { store } = useStore()
  const books = store.useQuery(books$)
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Books</h2>
        <Button>
          <Link to="/books/new">Create New Book</Link>
        </Button>
      </div>
      <ul className="list-disc pl-6">
        {books?.map(book => (
          <li key={book.id}>
            <Link
              to="/books/$bookId"
              params={{ bookId: book.id }}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              <strong>{book.title}</strong>
            </Link>
            {book.author && <span> by {book.author}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
