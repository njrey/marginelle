import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '@/livestore/schema'
import { BookProgressProvider, useBookProgress } from '@/contexts/BookProgressContext'
import { Slider } from '@/components/ui/slider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  const [sliderValue, setSliderValue] = useState<number[]>([currentPage || 1])

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

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value)
  }

  const handleSliderCommit = (value: number[]) => {
    setCurrentPage(value[0])
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
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Reading Progress</CardTitle>
            <div className="text-sm text-muted-foreground">
              {currentPage ? (
                <span>Page <strong>{sliderValue[0]}</strong> {sliderValue[0] !== currentPage && '(drag to update)'}</span>
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
              step={1}
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
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Jump to Latest (p.{maxPage})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Outlet />
    </div>
  )
}
