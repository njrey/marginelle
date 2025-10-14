import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/books')({
  component: BooksLayout,
})

function BooksLayout() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Books</h1>
        <nav className="space-x-4">
          <Link
            to="/books/list"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            List
          </Link>
          <Link
            to="/books/new"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            New
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
