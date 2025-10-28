import { createContext, useContext, type ReactNode } from 'react'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables, events } from '@/livestore/schema'

interface BookProgressContextValue {
  currentPage: number | null
  setCurrentPage: (page: number) => void
  maxPage: number | null
}

const BookProgressContext = createContext<BookProgressContextValue | null>(null)

interface BookProgressProviderProps {
  bookId: string
  children: ReactNode
}

export function BookProgressProvider({ bookId, children }: BookProgressProviderProps) {
  const { store } = useStore()

  // Query the book to get current page
  const book$ = queryDb(
    () => tables.books.where({ id: bookId, deletedAt: null }).first(),
    { label: `book-${bookId}` }
  )
  const book = store.useQuery(book$)

  // Query all notes and relationships to find the max page number
  const notes$ = queryDb(
    () => tables.notes.where({ bookId, deletedAt: null }),
    { label: `notes-for-book-${bookId}` }
  )
  const notes = store.useQuery(notes$)

  const relationships$ = queryDb(
    () => tables.noteRelationships.where({ deletedAt: null }),
    { label: `relationships-all` }
  )
  const relationships = store.useQuery(relationships$)

  // Calculate max page from notes and relationships
  const maxPage = Math.max(
    0,
    ...(notes?.map(n => n.pageNumber) || []),
    ...(relationships?.filter(r =>
      notes?.some(n => n.id === r.fromNoteId)
    ).map(r => r.pageNumber) || [])
  )

  const currentPage = book?.currentPage || null

  const setCurrentPage = (page: number) => {
    if (!book) return

    store.commit(
      events.bookProgressUpdated({
        id: bookId,
        currentPage: page,
      })
    )
  }

  return (
    <BookProgressContext.Provider value={{ currentPage, setCurrentPage, maxPage: maxPage || null }}>
      {children}
    </BookProgressContext.Provider>
  )
}

export function useBookProgress() {
  const context = useContext(BookProgressContext)
  if (!context) {
    throw new Error('useBookProgress must be used within BookProgressProvider')
  }
  return context
}
