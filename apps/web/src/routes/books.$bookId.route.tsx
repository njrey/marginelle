import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { getBook } from '@/lib/api'

export const Route = createFileRoute('/books/$bookId')({
  loader: async ({ params }) => {
    const book = await getBook(params.bookId)
    return { book }
  },
  component: BookDetailLayout,
})

function BookDetailLayout() {
  const { book } = Route.useLoaderData()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        <nav className="space-x-4">
          <Link
            to="/books/list"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Books
          </Link>
          <Link
            to="/books/$bookId/notes"
            params={{ bookId: book.id }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Notes
          </Link>
        </nav>
      </div>
      {book.author && <p className="text-gray-600 mb-4">by {book.author}</p>}
      <Outlet context={{ book }} />
    </div>
  )
}
