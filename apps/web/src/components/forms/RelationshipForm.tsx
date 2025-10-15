import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useCreateRelationship } from '@/hooks/use-relationships'
import { useNotes } from '@/hooks/use-notes'
import { useNavigate } from '@tanstack/react-router'
import { createRelationshipSchema, type CreateRelationshipFormData } from '@/lib/schemas'
import { RELATIONSHIP_TYPES } from '@/lib/api'

const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  impacts: 'Impacts',
  member_of: 'Member Of',
  ally: 'Ally',
  enemy: 'Enemy',
  family: 'Family',
  friend: 'Friend',
  owns: 'Owns',
  located_in: 'Located In',
  causes: 'Causes',
}

interface RelationshipFormProps {
  bookId: string
}

export function RelationshipForm({ bookId }: RelationshipFormProps) {
  const navigate = useNavigate()
  const { data: notes, isLoading: notesLoading } = useNotes(bookId)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreateRelationshipFormData>({
    resolver: zodResolver(createRelationshipSchema),
    defaultValues: {
      fromNoteId: '',
      toNoteId: '',
      relationshipType: '',
      description: '',
    },
  })

  const fromNoteId = watch('fromNoteId')

  // Use the mutation hook with the fromNoteId from the form
  // We'll need to get it dynamically during submission
  const createRelationshipMutation = useCreateRelationship(bookId, fromNoteId || '')

  const onSubmit = async (data: CreateRelationshipFormData) => {
    try {
      // Create a new mutation with the actual fromNoteId
      await createRelationshipMutation.mutateAsync({
        toNoteId: data.toNoteId,
        relationshipType: data.relationshipType,
        description: data.description || undefined,
      })

      reset()
      navigate({ to: '/books/$bookId/notes', params: { bookId } })
    } catch (error) {
      console.error('Failed to create relationship:', error)
    }
  }

  if (notesLoading) {
    return <div>Loading notes...</div>
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
          {Object.entries(RELATIONSHIP_TYPES).map(([key, value]) => (
            <option key={value} value={value}>
              {RELATIONSHIP_TYPE_LABELS[value] || value}
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
          disabled={isSubmitting || createRelationshipMutation.isPending}
        >
          {isSubmitting || createRelationshipMutation.isPending ? 'Creating...' : 'Create Relationship'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/books/$bookId/notes', params: { bookId } })}
        >
          Cancel
        </Button>
      </div>

      {createRelationshipMutation.isError && (
        <p className="text-red-600 text-sm">
          Failed to create relationship. Please try again.
        </p>
      )}
    </form>
  )
}
