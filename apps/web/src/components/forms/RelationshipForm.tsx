import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { events, tables } from '@/livestore/schema'
import { useNavigate } from '@tanstack/react-router'
import { createRelationshipSchema, type CreateRelationshipFormData } from '@/lib/schemas'

const RELATIONSHIP_TYPES = [
  { value: 'impacts', label: 'Impacts' },
  { value: 'member_of', label: 'Member Of' },
  { value: 'ally', label: 'Ally' },
  { value: 'enemy', label: 'Enemy' },
  { value: 'family', label: 'Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'owns', label: 'Owns' },
  { value: 'located_in', label: 'Located In' },
  { value: 'causes', label: 'Causes' },
]

interface RelationshipFormProps {
  bookId: string
}

export function RelationshipForm({ bookId }: RelationshipFormProps) {
  const { store } = useStore()
  const navigate = useNavigate()

  // Query notes for this book from LiveStore
  const notes$ = queryDb(
    () => tables.notes.where({ bookId, deletedAt: null }),
    { label: `notes-for-book-${bookId}` }
  )
  const notes = store.useQuery(notes$)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateRelationshipFormData>({
    resolver: zodResolver(createRelationshipSchema),
    defaultValues: {
      fromNoteId: '',
      toNoteId: '',
      relationshipType: '',
      description: '',
    },
  })

  const onSubmit = async (data: CreateRelationshipFormData) => {
    try {
      // Commit the RelationshipCreated event to LiveStore
      store.commit(
        events.relationshipCreated({
          id: crypto.randomUUID(),
          fromNoteId: data.fromNoteId,
          toNoteId: data.toNoteId,
          relationshipType: data.relationshipType as any, // Type is validated by zod schema
          description: data.description || null,
          createdAt: Date.now(),
        })
      )

      reset()
      navigate({ to: '/books/$bookId/notes', params: { bookId } })
    } catch (error) {
      console.error('Failed to create relationship:', error)
    }
  }

  if (!notes || notes.length < 2) {
    return (
      <div className="text-gray-500">
        <p>You need at least 2 notes to create a relationship.</p>
        <p className="text-sm mt-2">Create more notes first.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="fromNoteId" className="block text-sm font-medium text-gray-700 mb-1">
          From Note *
        </label>
        <select
          id="fromNoteId"
          {...register('fromNoteId')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select source note...</option>
          {notes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.title} ({note.type})
            </option>
          ))}
        </select>
        {errors.fromNoteId && (
          <p className="text-red-600 text-sm mt-1">{errors.fromNoteId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 mb-1">
          Relationship Type *
        </label>
        <select
          id="relationshipType"
          {...register('relationshipType')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select relationship type...</option>
          {RELATIONSHIP_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.relationshipType && (
          <p className="text-red-600 text-sm mt-1">{errors.relationshipType.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="toNoteId" className="block text-sm font-medium text-gray-700 mb-1">
          To Note *
        </label>
        <select
          id="toNoteId"
          {...register('toNoteId')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select target note...</option>
          {notes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.title} ({note.type})
            </option>
          ))}
        </select>
        {errors.toNoteId && (
          <p className="text-red-600 text-sm mt-1">{errors.toNoteId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Optional context about this relationship"
        />
        {errors.description && (
          <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Relationship'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/books/$bookId/notes', params: { bookId } })}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
