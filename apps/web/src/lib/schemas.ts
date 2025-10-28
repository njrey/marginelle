import { z } from 'zod'

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  author: z.string().max(255, 'Author must be less than 255 characters').optional().or(z.literal('')),
})

export type CreateBookFormData = z.infer<typeof createBookSchema>

export const createNoteSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().max(10000, 'Content must be less than 10000 characters').optional().or(z.literal('')),
  pageNumber: z.number().int().positive('Page number must be a positive integer'),
})

export type CreateNoteFormData = z.infer<typeof createNoteSchema>

export const createRelationshipSchema = z.object({
  fromNoteId: z.string().min(1, 'Source note is required'),
  toNoteId: z.string().min(1, 'Target note is required'),
  relationshipType: z.string().min(1, 'Relationship type is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().or(z.literal('')),
  pageNumber: z.number().int().positive('Page number must be a positive integer'),
})

export type CreateRelationshipFormData = z.infer<typeof createRelationshipSchema>