import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useCreateNote } from '@/hooks/use-notes'
import { useNavigate } from '@tanstack/react-router'
import { createNoteSchema, type CreateNoteFormData } from '@/lib/schemas'

const NOTE_TYPES = [
  { value: 'character', label: 'Character' },
  { value: 'organization', label: 'Organization' },
  { value: 'event', label: 'Event' },
  { value: 'location', label: 'Location' },
  { value: 'item', label: 'Item' },
  { value: 'concept', label: 'Concept' },
]

interface NoteFormProps {
  bookId: string
}

export function NoteForm({ bookId }: NoteFormProps) {
  const createNoteMutation = useCreateNote(bookId)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateNoteFormData>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      type: '',
      title: '',
      content: '',
    },
  })

  const onSubmit = async (data: CreateNoteFormData) => {
    try {
      await createNoteMutation.mutateAsync({
        type: data.type,
        title: data.title,
        content: data.content || undefined,
      })

      reset()
      navigate({ to: '/books/$bookId/notes', params: { bookId } })
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Type *
        </label>
        <select
          id="type"
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a type...</option>
          {NOTE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter note title"
        />
        {errors.title && (
          <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="content"
          {...register('content')}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter note content (optional)"
        />
        {errors.content && (
          <p className="text-red-600 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || createNoteMutation.isPending}
        >
          {isSubmitting || createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/books/$bookId/notes', params: { bookId } })}
        >
          Cancel
        </Button>
      </div>

      {createNoteMutation.isError && (
        <p className="text-red-600 text-sm">
          Failed to create note. Please try again.
        </p>
      )}
    </form>
  )
}
