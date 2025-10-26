import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useCreateBook } from '@/hooks/use-books'
import { useNavigate } from '@tanstack/react-router'
import { createBookSchema, type CreateBookFormData } from '@/lib/schemas'

export function BookForm() {
  const createBookMutation = useCreateBook()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateBookFormData>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      title: '',
      author: '',
    },
  })

  const onSubmit = async (data: CreateBookFormData) => {
    try {
      await createBookMutation.mutate({
        title: data.title,
        author: data.author || undefined,
      })

      reset()
      navigate({ to: '/books/list' })
    } catch (error) {
      console.error('Failed to create book:', error)
      // With LiveStore, errors are typically validation errors from Effect Schema
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter book title"
        />
        {errors.title && (
          <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
          Author
        </label>
        <input
          type="text"
          id="author"
          {...register('author')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter author name (optional)"
        />
        {errors.author && (
          <p className="text-red-600 text-sm mt-1">{errors.author.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Book'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/books/list' })}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}