import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBooks, createBook, type CreateBookRequest } from '@/lib/api'

export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      // Invalidate and refetch books list
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}