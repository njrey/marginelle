import { Outlet, createFileRoute } from '@tanstack/react-router'
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
    // Round to nearest whole page when user releases the slider
    const roundedPage = Math.round(value[0])
    setSliderValue([roundedPage])
    setCurrentPage(roundedPage)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        {book.author && <p className="text-muted-foreground">by {book.author}</p>}
      </div>

      {/* Reading Progress Control */}
      <Card className="mb-6 bg-accent/10 border-accent/30">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Reading Progress</CardTitle>
            <div className="text-sm text-muted-foreground">
              {currentPage ? (
                <span>Page <strong>{Math.round(sliderValue[0])}</strong> {Math.round(sliderValue[0]) !== currentPage && '(drag to update)'}</span>
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
                className="text-primary hover:text-primary/80 underline"
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
