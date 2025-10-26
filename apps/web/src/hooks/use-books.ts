//import { useQuery as useLiveStoreQuery } from '@livestore/react'
//import { useStore } from '@livestore/react'
//import { BooksTable } from '@/livestore/models/books'
//import { BookCreated } from '@/livestore/events/book-events'
//import { events } from '@/livestore/schema'
//
//// Hook to reactively query all books from local SQLite
//export function useBooks() {
//
//
//}
//
//// Hook to create a new book by committing an event
//export function useCreateBook() {
//  const store = useStore()
//
//  return {
//    mutate: async (data: { title: string; author?: string }) => {
//      // Commit the BookCreated event to LiveStore
//      await store.commit(BookCreated, {
//        id: crypto.randomUUID(),
//        title: data.title,
//        author: data.author ?? null,
//        createdAt: Date.now(),
//      })
//      // No need to invalidate queries - LiveStore reactively updates!
//    },
//  }
//}
