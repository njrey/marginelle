import { createFileRoute, getRouteApi } from '@tanstack/react-router'

export const Route = createFileRoute('/books/$bookId/')({
  component: BookDetailIndexPage,
})

function BookDetailIndexPage() {
  const parentRoute = getRouteApi('/books/$bookId')
  const { book } = parentRoute.useLoaderData()

  return (
    <div>
      <p className="text-gray-600">You are viewing details for "{book.title}"</p>
      {book.author && <p className="text-gray-600">Written by {book.author}</p>}
      <p className="text-gray-600 mt-4">Click "Notes" in the navigation to view notes for this book.</p>
    </div>
  )
}
