import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to Marginelle</h1>
      <nav>
        <Link
          to="/books/list"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View Books
        </Link>
      </nav>
    </div>
  )
}
