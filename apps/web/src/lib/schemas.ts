import { z } from 'zod'

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  author: z.string().max(255, 'Author must be less than 255 characters').optional().or(z.literal('')),
})

export type CreateBookFormData = z.infer<typeof createBookSchema>