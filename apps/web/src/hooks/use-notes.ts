import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotes, getNote, createNote, type CreateNoteRequest } from '@/lib/api'

export function useNotes(bookId: string) {
  return useQuery({
    queryKey: ['notes', bookId],
    queryFn: () => getNotes(bookId),
  })
}

export function useNote(bookId: string, noteId: string) {
  return useQuery({
    queryKey: ['note', bookId, noteId],
    queryFn: () => getNote(bookId, noteId),
    enabled: !!bookId && !!noteId,
  })
}

export function useCreateNote(bookId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNoteRequest) => createNote(bookId, data),
    onSuccess: () => {
      // Invalidate and refetch notes list for this book
      queryClient.invalidateQueries({ queryKey: ['notes', bookId] })
    },
  })
}
