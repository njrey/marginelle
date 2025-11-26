import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { tables } from '@/livestore/schema'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import type { Book } from '@/livestore/schema'

export const Route = createFileRoute('/books/list')({
  component: BooksListPage,
})

const books$ = queryDb(
  () => {
    return tables.books.where({
      deletedAt: null,
    })
  },
  { label: 'visibleBooks' },
)

// Book cover color palette - warm, muted tones
const BOOK_COLORS = [
  'oklch(0.65 0.15 25)',   // Burnt Sienna
  'oklch(0.60 0.12 75)',   // Golden Ochre
  'oklch(0.50 0.10 140)',  // Sage Green
  'oklch(0.55 0.15 220)',  // Dusty Blue
  'oklch(0.45 0.08 15)',   // Deep Mahogany
  'oklch(0.70 0.10 50)',   // Warm Taupe
  'oklch(0.58 0.14 350)',  // Dusty Rose
  'oklch(0.52 0.12 170)',  // Teal
]

/**
 * Get deterministic book color based on book ID
 */
function getBookColor(bookId: string): string {
  const hashCode = bookId.split('').reduce((acc, char) =>
    acc + char.charCodeAt(0), 0
  )
  const colorIndex = hashCode % BOOK_COLORS.length
  return BOOK_COLORS[colorIndex]
}

/**
 * Distribute books across shelves evenly
 */
function distributeBooks(books: readonly Book[] | undefined, numShelves: number = 3): Book[][] {
  if (!books || books.length === 0) {
    return Array(numShelves).fill(null).map(() => [])
  }

  const sortedBooks = [...books].sort((a, b) => b.createdAt - a.createdAt)
  const shelves: Book[][] = Array(numShelves).fill(null).map(() => [])

  sortedBooks.forEach((book, index) => {
    const shelfIndex = index % numShelves
    shelves[shelfIndex].push(book)
  })

  return shelves
}

/**
 * Individual book cover component
 */
function BookCover({ book }: { book: Book }) {
  const backgroundColor = getBookColor(book.id)

  return (
    <Link
      to="/books/$bookId"
      params={{ bookId: book.id }}
      className="
        group block relative
        transition-all duration-300 ease-out
        hover:-translate-y-2 hover:scale-105 hover:z-10
        active:scale-95 active:opacity-90
        focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring
        motion-reduce:transform-none motion-reduce:transition-none
      "
      aria-label={`View ${book.title}${book.author ? ` by ${book.author}` : ''}`}
    >
      <div
        className="
          aspect-[2/3]
          rounded-md
          shadow-lg
          flex flex-col
          justify-between
          p-3 sm:p-4
          transition-shadow duration-300
          group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]
        "
        style={{ backgroundColor }}
      >
        <div className="text-sm font-bold leading-tight text-foreground/90 line-clamp-3">
          {book.title}
        </div>
        {book.author && (
          <div className="text-xs italic text-foreground/70 line-clamp-2">
            {book.author}
          </div>
        )}
      </div>
    </Link>
  )
}

/**
 * Individual shelf component
 */
function Shelf({ books }: { books: Book[] }) {
  return (
    <div
      className="
        border-b-4 border-[oklch(0.25_0.04_30)]
        pb-4 sm:pb-6 mb-4 sm:mb-6
        last:border-b-0 last:pb-0 last:mb-0
        relative
        after:absolute after:bottom-[-2px] after:left-0 after:right-0
        after:h-[2px] after:bg-[oklch(0.45_0.05_35)]
        after:opacity-30 after:last:hidden
      "
    >
      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          gap-4 sm:gap-6
          max-w-[800px]
          mx-auto
          items-end
          justify-items-center
        "
      >
        {books.map((book) => (
          <BookCover key={book.id} book={book} />
        ))}
      </div>
    </div>
  )
}

/**
 * Main bookshelf container
 */
function Bookshelf({ shelves }: { shelves: Book[][] }) {
  const hasBooks = shelves.some(shelf => shelf.length > 0)

  return (
    <div
      className="
        bg-gradient-to-b from-[oklch(0.40_0.05_35)] to-[oklch(0.35_0.05_30)]
        rounded-lg
        shadow-2xl
        p-4 sm:p-6 md:p-8
        border-2 border-[oklch(0.30_0.04_35)]
        relative
        overflow-hidden
        before:absolute before:inset-0
        before:bg-[radial-gradient(circle_at_30%_20%,oklch(0.45_0.05_35)_0%,transparent_50%)]
        before:opacity-20
        before:pointer-events-none
      "
    >
      {hasBooks ? (
        shelves.map((books, index) => (
          <Shelf key={index} books={books} />
        ))
      ) : (
        <div className="text-center py-12 sm:py-16 relative z-10">
          <p className="text-lg mb-4 text-[oklch(0.85_0.02_40)]">
            Your bookshelf is empty
          </p>
          <p className="text-sm text-[oklch(0.75_0.02_40)]">
            Click "Create New Book" above to add your first book
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Main page component
 */
function BooksListPage() {
  const { store } = useStore()
  const books = store.useQuery(books$)
  const shelves = distributeBooks(books, 3)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Bookshelf</h2>
        <Button>
          <Link to="/books/new">Create New Book</Link>
        </Button>
      </div>

      <Bookshelf shelves={shelves} />
    </div>
  )
}
