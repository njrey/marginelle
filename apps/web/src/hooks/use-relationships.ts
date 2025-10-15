import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRelationships,
  createRelationship,
  deleteRelationship,
  type CreateRelationshipRequest,
} from '@/lib/api'

export function useRelationships(bookId: string, noteId: string) {
  return useQuery({
    queryKey: ['relationships', bookId, noteId],
    queryFn: () => getRelationships(bookId, noteId),
    enabled: !!bookId && !!noteId,
  })
}

export function useCreateRelationship(bookId: string, noteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRelationshipRequest) => createRelationship(bookId, noteId, data),
    onSuccess: () => {
      // Invalidate relationships for this note
      queryClient.invalidateQueries({ queryKey: ['relationships', bookId, noteId] })
      // Also invalidate the notes list to refresh relationship counts if displayed
      queryClient.invalidateQueries({ queryKey: ['notes', bookId] })
    },
  })
}

export function useDeleteRelationship(bookId: string, noteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (relationshipId: string) => deleteRelationship(bookId, noteId, relationshipId),
    onSuccess: () => {
      // Invalidate relationships for this note
      queryClient.invalidateQueries({ queryKey: ['relationships', bookId, noteId] })
      // Also invalidate the notes list to refresh relationship counts if displayed
      queryClient.invalidateQueries({ queryKey: ['notes', bookId] })
    },
  })
}
