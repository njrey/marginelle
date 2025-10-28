import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'
import { BookProgressProvider, useBookProgress } from '@/contexts/BookProgressContext'
import { useState } from 'react'

export const Route = createFileRoute('/books/$bookId')({
  component: BookDetailLayout,
})

function BookDetailLayout() {
  const { bookId } = Route.useParams()

  return (
    <BookProgressProvider bookId={bookId}>
      <BookDetailContent />
    </BookProgressProvider>
  )
}

function BookDetailContent() {
  const { bookId } = Route.useParams()
  const { store } = useStore()
  const { currentPage, setCurrentPage, maxPage } = useBookProgress()
  const [inputPage, setInputPage] = useState(currentPage?.toString() || '1')

  // Query for a single book by ID from local SQLite
  const book$ = queryDb(
    () => tables.books.where({ id: bookId, deletedAt: null }).first(),
    { label: `book-${bookId}` }
  )

  const book = store.useQuery(book$)

  // Handle loading/not found states
  if (!book) {
    return <div>Book not found or loading...</div>
  }

  const handlePageUpdate = () => {
    const page = parseInt(inputPage)
    if (!isNaN(page) && page > 0) {
      setCurrentPage(page)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{book.title}</h1>
          {book.author && <p className="text-gray-600">by {book.author}</p>}
        </div>
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

      {/* Reading Progress Control */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="reading-progress" className="block text-sm font-medium text-gray-700 mb-2">
              Reading Progress
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="reading-progress"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onBlur={handlePageUpdate}
                onKeyDown={(e) => e.key === 'Enter' && handlePageUpdate()}
                min="1"
                className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Page"
              />
              <button
                onClick={handlePageUpdate}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
              {maxPage && (
                <button
                  onClick={() => {
                    setInputPage(maxPage.toString())
                    setCurrentPage(maxPage)
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Jump to Latest (p.{maxPage})
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {currentPage ? (
              <span>Viewing as of page <strong>{currentPage}</strong></span>
            ) : (
              <span>Set your reading progress to filter notes</span>
            )}
            {maxPage && <div className="text-xs text-gray-500 mt-1">Latest content: page {maxPage}</div>}
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
